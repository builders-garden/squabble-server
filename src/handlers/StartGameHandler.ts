import { GameStatus } from "@prisma/client";
import { gameRoomManager } from "../game-room-manager.js";
import { sendAgentMessage } from "../lib/agent/api.js";
import { END_GAME_MESSAGE, GAME_DURATION } from "../lib/constants.js";
import { env } from "../lib/env.js";
import { getGameParticipantsByGameId } from "../lib/prisma/game-participants/index.js";
import {
  getGameById,
  getStakedPlayersCount,
  setGameWinner,
  updateGame,
} from "../lib/prisma/games/index.js";
import { setGameResult, startGame } from "../lib/viem/index.js";
import { getRandomAvailableLetters } from "../lib/words.js";
import { SocketHandler } from "./SocketHandler.js";

const appUrl = env.NEXT_PUBLIC_AGENT_URL;

interface StartGameData {
  player: { fid: string };
  gameId: string;
}

export class StartGameHandler extends SocketHandler {
  async handle({ player, gameId }: StartGameData) {
    console.log(`[GAME] Starting game ${gameId}`);

    const room = await gameRoomManager.getGameRoom(gameId);
    if (!room) return;

    const game = await getGameById(gameId);
    const stakedPlayersCount = await getStakedPlayersCount(gameId);

    const players = Array.from(room.players.values());
    const readyPlayers = players.filter((player) => player.ready);
    if (!readyPlayers.length || readyPlayers.length < 2) {
      console.log(
        `[GAME] Not enough players are ready to start game ${gameId}`
      );
      return;
    }

    if (game?.status === GameStatus.PLAYING) {
      console.log(`[GAME] Game ${gameId} is already started`);
      return;
    }

    this.emitToGame(gameId, "game_loading", {
      gameId,
      title: "Starting game",
      message: "Initializing game board and preparing your letters...",
    });

    // Ensure loading state lasts at least 7.5 seconds
    const loadingDelay = new Promise((resolve) => setTimeout(resolve, 7500));
    const gameInitialization = (async () => {
      await startGame(game?.contractGameId?.toString() ?? "");

      await updateGame(gameId, {
        status: GameStatus.PLAYING,
      });

      room.timeRemaining = GAME_DURATION;
      // Start game timer
      room.timer = setInterval(async () => {
        room.timeRemaining--;
        this.emitToGame(gameId, "timer_tick", {
          timeRemaining: room.timeRemaining,
          gameId,
        });
        if (room.timeRemaining <= 0) {
          console.log(`[GAME] Game ${gameId} ended due to time expiration`);
          clearInterval(room.timer!);
          this.emitToGame(gameId, "game_loading", {
            gameId,
            title: "Game over!",
            message: "Calculating final scores and distributing rewards...",
          });
          const participants = await getGameParticipantsByGameId(gameId);
          const sortedParticipants = participants.sort(
            (a, b) => b.points - a.points
          );
          if (!sortedParticipants.length) {
            console.error(`[GAME] No participants found for game ${gameId}`);
            return;
          }

          const topPoints = sortedParticipants[0].points;
          const winners = sortedParticipants.filter(
            (p) => p.points === topPoints
          );
          const isDraw = winners.length > 1;
          const winner = winners[0];
          await setGameResult(
            room.contractGameId.toString(),
            isDraw,
            winners.map((p) => p.address as `0x${string}`)
          );
          await setGameWinner(gameId, winner.fid);

          if (room.conversationId) {
            try {
              const messageResponse = await sendAgentMessage(
                "/api/send-message",
                room.conversationId,
                isDraw
                  ? `🎯 It's a draw! Multiple players tied with ${
                      winner.points
                    } points!${
                      typeof game?.betAmount === "number" && game.betAmount > 0
                        ? ` The buy-in of ${game.betAmount} USDC will be sent back to: ${winners
                            .map((w) => w.user.displayName)
                            .join(", ")} 🤝`
                        : ""
                    }`
                  : `🎉 Congratulations ${winner.user.displayName}! You've won the Squabble game with ${winner.points} points! 🏆` +
                    (typeof game?.betAmount === "number" && game.betAmount > 0
                      ? `\nThe total buy-in of ${game.betAmount * stakedPlayersCount} USDC will be sent to you!`
                      : "")
              );
              if (!messageResponse) {
                console.error("Failed to send winner message");
                throw new Error("Failed to send winner message");
              }
            } catch (error) {
              console.error("Error sending winner message:", error);
            }
            try {
              const messageResponse = await sendAgentMessage(
                "/api/send-message",
                room.conversationId,
                END_GAME_MESSAGE
              );
              if (!messageResponse) {
                console.error("Failed to send END_GAME_MESSAGE message");
                throw new Error("Failed to send END_GAME_MESSAGE message");
              }
            } catch (error) {
              console.error("Error sending END_GAME_MESSAGE message:", error);
            }
          }

          const updatedRoom = await gameRoomManager.getGameRoom(gameId);
          if (!updatedRoom) {
            console.error(`[GAME] Game room not found for game ${gameId}`);
            return;
          }

          this.emitToGame(gameId, "game_ended", {
            gameId,
            players: Array.from(updatedRoom.players.values()),
          });
          // Clear the interval again after game ended event
          clearInterval(room.timer!);
          room.timer = null;
        }
      }, 1200);
      // populate center of the board with a random word
      await gameRoomManager.initBoard(gameId);
    })();

    await Promise.all([loadingDelay, gameInitialization]);

    this.emitToGame(gameId, "game_started", {
      board: room.board,
      timeRemaining: room.timeRemaining,
      players: Array.from(room.players.values()),
    });
    const newPlayers = Array.from(room.players.values()).map((player) => ({
      ...player,
      availableLetters: getRandomAvailableLetters(7),
    }));
    this.emitToGame(gameId, "refreshed_available_letters", {
      gameId,
      players: newPlayers,
    });
  }
}

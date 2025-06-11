import fetch from "node-fetch";
import { gameRoomManager } from "../game-room-manager.js";
import { env } from "../lib/env.js";
import { getGameParticipantsByGameId } from "../lib/prisma/game-participants/index.js";
import { getGameById, setGameWinner, updateGame } from "../lib/prisma/games/index.js";
import { setGameResult, startGame } from "../lib/viem/index.js";
import { getRandomAvailableLetters } from "../lib/words.js";
import { SocketHandler } from "./SocketHandler.js";
import { GameStatus } from "@prisma/client";

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

    await startGame(room.contractGameId.toString());

    await updateGame(gameId, {
      status: GameStatus.PLAYING,
    });

    room.timeRemaining = 60;
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
        const sortedParticipants = participants.sort((a, b) => b.points - a.points);
        if (!sortedParticipants.length) {
          console.error(`[GAME] No participants found for game ${gameId}`);
          return;
        }
        
        const topPoints = sortedParticipants[0].points;
        const winners = sortedParticipants.filter(p => p.points === topPoints);
        const isDraw = winners.length > 1;
        const winner = winners[0];
        await setGameResult(
          room.contractGameId.toString(),
          isDraw,
          winners.map((p) => p.address as `0x${string}`)
        );
        await setGameWinner(gameId, winner.fid);

        //send message to winner
        try {
          const externalApiUrl = `${appUrl}/api/send-message`;

          const messageResponse = await fetch(externalApiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-agent-secret": env.RECEIVE_AGENT_SECRET,
            },
            body: JSON.stringify({
              conversationId: room.conversationId,
              message: `🎉 Congratulations ${winner.user.displayName}! You've won the Squabble game with ${winner.points} points! 🏆`,
            }),
          });

          if (!messageResponse.ok) {
            console.error(
              `Failed to send winner message: ${messageResponse.status} ${messageResponse.statusText}`
            );
            throw new Error("Failed to send winner message");
          } else {
          }
        } catch (error) {
          console.error("Error sending winner message:", error);
        }

        this.emitToGame(gameId, "game_ended", {
          gameId,
          players: Array.from(room.players.values()),
        });
        // Clear the interval again after game ended event
        clearInterval(room.timer!);
        room.timer = null;
      }
    }, 1200);
    // populate center of the board with a random word
    await gameRoomManager.initBoard(gameId);
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

import { gameRoomManager } from "../game-room-manager.js";
import { setGameResult, startGame } from "../lib/viem/index.js";
import { getRandomAvailableLetters } from "../lib/words.js";
import { SocketHandler } from "./SocketHandler.js";

interface StartGameData {
  player: { fid: string };
  gameId: string;
}

export class StartGameHandler extends SocketHandler {
  async handle({ player, gameId }: StartGameData) {
    console.log(`[GAME] Starting game ${gameId}`);

    const room = await gameRoomManager.getGameRoom(gameId);
    if (!room) return;

    const players = Array.from(room.players.values());
    const readyPlayers = players.filter((player) => player.ready);
    if (!readyPlayers.length || readyPlayers.length < 2) {
      console.log(`[GAME] Not enough players are ready to start game ${gameId}`);
      return;
    }

    this.emitToGame(gameId, "game_loading", {
      gameId,
      title: "Starting game",
      message: "Initializing game board and preparing your letters...",
    });

    await startGame(room.contractGameId.toString());

    room.timeRemaining = 300;
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
        const winner = Array.from(room.players.values()).sort(
          (a, b) => b.score - a.score
        )[0];
        this.emitToGame(gameId, "game_loading", {
          gameId,
          title: "Game over!",
          message: "Calculating final scores and distributing rewards...",
        });
        await setGameResult(
          room.contractGameId.toString(),
          false,
          winner.fid.toString(),
          Array.from(room.players.keys()).map((key) => key.toString())
        );
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
    console.log("newPlayers", newPlayers);
    this.emitToGame(gameId, "refreshed_available_letters", {
      gameId,
      players: newPlayers,
    });
  }
}

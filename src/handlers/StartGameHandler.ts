import { gameRoomManager } from "../game-room-manager.js";
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
    const allPlayersReady = Array.from(room.players.values()).every(
      (player) => player.ready
    );
    console.log("allPlayersReady", allPlayersReady);
    if (!allPlayersReady) {
      console.log(`[GAME] Not all players are ready to start game ${gameId}`);
      return;
    }

    room.timeRemaining = 300;
    // Start game timer
    room.timer = setInterval(() => {
      room.timeRemaining--;
      this.emitToGame(gameId, "timer_tick", {
        timeRemaining: room.timeRemaining,
        gameId,
      });
      if (room.timeRemaining <= 0) {
        console.log(`[GAME] Game ${gameId} ended due to time expiration`);
        clearInterval(room.timer!);
        this.emitToGame(gameId, "game_ended", {
          gameId,
          players: Array.from(room.players.values()),
        });
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

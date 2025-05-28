import { gameRoomManager } from "../game-room-manager";
import { SocketHandler } from "./SocketHandler";

interface StartGameData {
  player: { fid: string };
  gameId: string;
}

export class StartGameHandler extends SocketHandler {
  handle({ player, gameId }: StartGameData) {
    console.log(`[GAME] Starting game ${gameId}`);

    const room = gameRoomManager.getGameRoom(gameId);
    if (!room) return;

    // Start game timer
    room.timer = setInterval(() => {
      room.timeRemaining--;
      this.emitToGame(gameId, "timer_tick", room.timeRemaining);
      if (room.timeRemaining <= 0) {
        console.log(`[GAME] Game ${gameId} ended due to time expiration`);
        clearInterval(room.timer!);
        this.emitToGame(gameId, "game_ended", {});
      }
    }, 1000);

    this.emitToGame(gameId, "game_started", {
      board: room.board,
      timeRemaining: room.timeRemaining,
    });
  }
}

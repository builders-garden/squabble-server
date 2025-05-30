import { gameRoomManager } from "../game-room-manager.js";
import { SocketHandler } from "./SocketHandler.js";

interface RemoveLetterData {
  player: { fid: number };
  gameId: string;
  x: number;
  y: number;
}

export class RemoveLetterHandler extends SocketHandler {
  async handle({ player, gameId, x, y }: RemoveLetterData) {
    console.log(
      `[GAME] Player ${player.fid} removing letter at position [${x}, ${y}] in game ${gameId}`
    );

    const room = await gameRoomManager.getGameRoom(gameId);
    if (!room) return;

    if (room.board[x][y] !== "") {
      await gameRoomManager.updatePlayerBoard(gameId, player.fid, room.board);
      this.emitToGame(gameId, "letter_removed", {
        x,
        y,
        gameId,
        player,
      });
    }
  }
}

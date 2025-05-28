import { gameRoomManager } from "../game-room-manager";
import { SocketHandler } from "./SocketHandler";

interface RemoveLetterData {
  player: { fid: string };
  gameId: string;
  x: number;
  y: number;
}

export class RemoveLetterHandler extends SocketHandler {
  handle({ player, gameId, x, y }: RemoveLetterData) {
    console.log(
      `[GAME] Player ${player.fid} removing letter at position [${x}, ${y}] in game ${gameId}`
    );

    const room = gameRoomManager.getGameRoom(gameId);
    if (!room) return;

    if (room.board[x][y] !== "") {
      gameRoomManager.updatePlayerBoard(gameId, player.fid, room.board);
      this.emitToGame(gameId, "letter_removed", {
        x,
        y,
        gameId,
        player,
      });
    }
  }
}

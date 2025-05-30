import { gameRoomManager } from "../game-room-manager.js";
import { SocketHandler } from "./SocketHandler.js";

interface PlaceLetterData {
  player: { fid: number };
  gameId: string;
  x: number;
  y: number;
  letter: string;
}

export class PlaceLetterHandler extends SocketHandler {
  async handle({ player, gameId, x, y, letter }: PlaceLetterData) {
    console.log(
      `[GAME] Player ${player.fid} placing letter "${letter}" at position [${x}, ${y}] in game ${gameId}`
    );

    const room = await gameRoomManager.getGameRoom(gameId);
    if (!room) return;

    if (room.board[x][y] === "") {
      room.board[x][y] = letter;
      await gameRoomManager.updatePlayerBoard(gameId, player.fid, room.board);
      this.emitToGame(gameId, "letter_placed", {
        x,
        y,
        letter,
        gameId,
        player,
      });
    }
  }
}

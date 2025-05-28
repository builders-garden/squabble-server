import { gameRoomManager } from "../game-room-manager";
import { SocketHandler } from "./SocketHandler";

interface PlaceLetterData {
  player: { fid: string };
  gameId: string;
  x: number;
  y: number;
  letter: string;
}

export class PlaceLetterHandler extends SocketHandler {
  handle({ player, gameId, x, y, letter }: PlaceLetterData) {
    console.log(
      `[GAME] Player ${player.fid} placing letter "${letter}" at position [${x}, ${y}] in game ${gameId}`
    );

    const room = this.getGame(gameId);
    if (!room) return;

    if (room.board[x][y] === "") {
      room.board[x][y] = letter;
      gameRoomManager.updatePlayerBoard(gameId, player.fid, room.board);
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

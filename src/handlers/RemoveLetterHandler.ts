import { gameRoomManager } from "../game-room-manager.js";
import type { RemoveLetterEvent } from "../types/index.js";
import { ServerToClientSocketEvents } from "../types/socket/socket.enum.js";
import { SocketHandler } from "./SocketHandler.js";

export class RemoveLetterHandler extends SocketHandler {
	async handle({ player, gameId, x, y }: RemoveLetterEvent) {
		console.log(
			`[GAME] Player ${player.fid} removing letter at position [${x}, ${y}] in game ${gameId}`,
		);

		const room = await gameRoomManager.getGameRoom(gameId);
		if (!room) return;

		if (room.board[x][y] !== "") {
			//await gameRoomManager.updatePlayerBoard(gameId, player.fid, room.board);
			this.emitToGame(gameId, ServerToClientSocketEvents.LETTER_REMOVED, {
				gameId,
				player,
				position: {
					x,
					y,
				},
			});
		}
	}
}

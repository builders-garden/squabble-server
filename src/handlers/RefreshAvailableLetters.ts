import { gameRoomManager } from "../game-room-manager.js";
import { getRandomAvailableLetters } from "../lib/words.js";
import type { RefreshAvailableLettersEvent } from "../types/index.js";
import { ServerToClientSocketEvents } from "../types/socket/socket.enum.js";
import { SocketHandler } from "./SocketHandler.js";

export class RefreshAvailableLetters extends SocketHandler {
	async handle({ playerId, gameId }: RefreshAvailableLettersEvent) {
		const room = await gameRoomManager.getGameRoom(gameId);
		if (!room) return;
		const player = room.players.get(playerId);
		if (!player) return;
		const updatedPlayer = {
			...player,
			availableLetters: getRandomAvailableLetters(7),
		};
		room.players.set(playerId, updatedPlayer);

		this.emitToGame(gameId, ServerToClientSocketEvents.REFRESHED_AVAILABLE_LETTERS, {
			gameId,
			players: [updatedPlayer],
			playerId,
		});
	}
}

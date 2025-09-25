import { GameStatus } from "@prisma/client";
import { gameRoomManager } from "../game-room-manager.js";
import { ServerToClientSocketEvents } from "../types/socket/socket.enum.js";
import { SocketHandler } from "./SocketHandler.js";

export class DisconnectPlayerHandler extends SocketHandler {
	async handle(): Promise<void> {
		console.log(`[CONNECTION] Disconnecting player: ${this.socket.id}`);
		await this.disconnectPlayer(this.socket.id);
		console.log(`[CONNECTION] Disconnected player: ${this.socket.id}`);
	}

	private async disconnectPlayer(socketId: string): Promise<void> {
		// Get all rooms the socket is in
		const gameRoomIds = await gameRoomManager.getActiveGames();

		// Disconnect from each game room
		for (const gameRoomId of gameRoomIds) {
			console.log(
				`[CONNECTION] Disconnecting player: ${socketId} from game: ${gameRoomId}`,
			);
			const gameRoom = await gameRoomManager.getGameRoom(gameRoomId);
			if (!gameRoom) {
				console.error(`[CONNECTION] Game room ${gameRoomId} not found`);
				continue;
			}
			console.log(
				`[CONNECTION] Game room ${gameRoomId} found with players: ${JSON.stringify(
					Array.from(gameRoom.players.values()),
				)}`,
			);
			// Find and remove the player with matching socketId
			for (const [fid, player] of gameRoom.players.entries()) {
				console.log(
					`[CONNECTION] Disconnecting player: ${player?.socketId} from game: ${gameRoom}`,
				);
				if (player?.socketId === socketId) {
					// Use GameRoomManager to remove the player
					await gameRoomManager.removePlayer(gameRoomId, fid);

					// Notify other players
					this.emitToGame(gameRoomId, ServerToClientSocketEvents.PLAYER_LEFT, {
						player,
						gameId: gameRoomId,
					});
					this.emitToGame(gameRoomId, ServerToClientSocketEvents.GAME_UPDATE, {
						gameId: gameRoomId,
						players: Array.from(gameRoom.players.values()),
						status: GameStatus.PENDING,
					});
					break; // Break since a player can only be in one room
				}
			}
		}
	}
}

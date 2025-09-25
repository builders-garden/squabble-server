import { GameStatus } from "@prisma/client";
import { gameRoomManager } from "../game-room-manager.js";
import { sendAgentMessage } from "../lib/agent/api.js";
import type { PlayerStakeRefundedEvent } from "../types/index.js";
import { ServerToClientSocketEvents } from "../types/socket/socket.enum.js";
import { SocketHandler } from "./SocketHandler.js";
export class PlayerStakeRefundedHandler extends SocketHandler {
	async handle({ player, gameId, transactionHash }: PlayerStakeRefundedEvent) {
		console.log(
			`[LOBBY] Player ${player.fid} refunded stake in game ${gameId} tx hash https://basescan.org/tx/${transactionHash}`,
		);
		await gameRoomManager.updatePlayerStakeRefunded(gameId, player.fid);
		const room = await gameRoomManager.getGameRoom(gameId);
		if (room) {
			this.emitToGame(gameId, ServerToClientSocketEvents.GAME_UPDATE, {
				gameId,
				status: GameStatus.PENDING,
				players: Array.from(room.players.values()),
			});
			try {
				const messageResponse = await sendAgentMessage(
					"/api/send-message",
					room.conversationId,
					`😢 ${player.username} left the game and has been refunded.`,
				);
				if (!messageResponse) {
					console.error("Failed to send player stake refunded message");
					throw new Error("Failed to send player stake refunded message");
				}
			} catch (error) {
				console.error("Error sending player stake refunded message:", error);
			}
		}
	}
}

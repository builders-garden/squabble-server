import { GameStatus } from "@prisma/client";
import { gameRoomManager } from "../game-room-manager";
import { sendAgentMessage } from "../lib/agent/api";
import type { PlayerStakeConfirmedEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/socket/socket.enum";
import { SocketHandler } from "./SocketHandler";


export class PlayerStakeConfirmedHandler extends SocketHandler {
	async handle({
		player,
		gameId,
		paymentHash,
		payerAddress,
	}: PlayerStakeConfirmedEvent) {
		console.log(
			`[LOBBY] Player ${player.fid} confirmed stake in game ${gameId}`,
		);
		await gameRoomManager.updatePlayerReady(
			gameId,
			player.fid,
			true,
			paymentHash,
			payerAddress,
		);
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
					`🎉 ${player.username} is ready to play!`,
				);
				if (!messageResponse) {
					console.error("Failed to send player stake confirmed message");
					throw new Error("Failed to send player stake confirmed message");
				}
			} catch (error) {
				console.error("Error sending player stake confirmed message:", error);
			}
		}
	}
}

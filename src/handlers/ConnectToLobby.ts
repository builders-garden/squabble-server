import { GameStatus } from "@prisma/client";
import { gameRoomManager } from "../game-room-manager.js";
import { getGameById } from "../lib/prisma/games/index.js";
import type { ConnectToLobbyEvent } from "../types/index.js";
import { ServerToClientSocketEvents } from "../types/socket/socket.enum.js";
import { SocketHandler } from "./SocketHandler.js";

export class ConnectToLobbyHandler extends SocketHandler {
	async handle({ player, gameId }: ConnectToLobbyEvent) {
		console.log(`[LOBBY] Player ${player.fid} connecting to game ${gameId}`);
		console.log("[LOBBY] Player details:", {
			fid: player.fid,
			socketId: this.socket.id,
			address: player.address,
			ready: player.ready,
		});

		console.log(`[LOBBY] Fetching game ${gameId} from database...`);
		const game = await getGameById(gameId);
		console.log("[LOBBY] Game data:", {
			id: game?.id,
			status: game?.status,
			contractGameId: game?.contractGameId,
			betAmount: game?.betAmount,
		});

		if (!game) {
			console.error(`[LOBBY] Game ${gameId} not found`);
			return;
		}

		if (game.status === GameStatus.FINISHED) {
			console.error(
				`[LOBBY] Cannot join game ${gameId} because it's already finished`,
			);
			return;
		}

		if (game.status === GameStatus.PLAYING) {
			console.error(
				`[LOBBY] Cannot join game ${gameId} because it's already started`,
			);
			return;
		}

		console.log(`[LOBBY] Attempting to get game room for ${gameId}...`);
		let room = await gameRoomManager.getGameRoom(gameId);
		console.log("[LOBBY] Current room state:", {
			exists: !!room,
			playersCount: room?.players.size,
			timeRemaining: room?.timeRemaining,
			contractGameId: room?.contractGameId,
		});

		if (!room) {
			console.log(`[LOBBY] Creating new game room ${gameId}`);
			try {
				room = await gameRoomManager.createGameRoom(gameId);
				console.log("[LOBBY] New room created:", {
					playersCount: room.players.size,
					timeRemaining: room.timeRemaining,
					contractGameId: room.contractGameId,
				});
			} catch (error) {
				console.error("[LOBBY] Failed to create game room:", error);
				return;
			}
		}

		if (room.players.size >= 6 && !room.players.has(player.fid)) {
			console.error(
				`[LOBBY] Cannot join game ${gameId} because it's already full`,
			);
			this.emitToGame(gameId, ServerToClientSocketEvents.GAME_FULL, {
				gameId,
				players: Array.from(room.players.values()),
			});
			return;
		}

		console.log(`[LOBBY] Joining socket to game room ${gameId}...`);
		this.socket.join(gameId);
		console.log("[LOBBY] Socket joined game room");

		try {
			console.log(`[LOBBY] Adding player ${player.fid} to game room...`);
			if (!game.contractGameId) {
				console.error("[LOBBY] Game contract ID is required");
				throw new Error("Game contract ID is required");
			}
			await gameRoomManager.addPlayer(
				gameId,
				game.contractGameId,
				{ ...player, socketId: this.socket.id },
				game.betAmount > 0,
			);
			console.log(
				`[LOBBY] Player ${player.fid} successfully added to game room`,
			);
		} catch (error) {
			console.error("[LOBBY] Failed to add player to game room:", error);
			return;
		}

		console.log(`[LOBBY] Player ${player.fid} joined game ${gameId}`);
		this.emitToGame(gameId, ServerToClientSocketEvents.PLAYER_JOINED, {
			player,
			gameId,
		});
		this.emitToGame(gameId, ServerToClientSocketEvents.GAME_UPDATE, {
			gameId,
			players: Array.from(room.players.values()),
			status: game.status,
		});

		console.log("[LOBBY] Game events emitted successfully");
	}
}

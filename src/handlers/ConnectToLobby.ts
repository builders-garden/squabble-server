import { GameStatus } from "@prisma/client";
import { gameRoomManager } from "../game-room-manager.js";
import { Player } from "../interfaces.js";
import { getGameById } from "../lib/prisma/games/index.js";
import { SocketHandler } from "./SocketHandler.js";

export class ConnectToLobbyHandler extends SocketHandler {
  async handle({ player, gameId }: { player: Player; gameId: string}) {
    console.log(`[LOBBY] Player ${player.fid} connecting to game ${gameId}`);

    const game = await getGameById(gameId);
    if (!game) {
      console.error(`[LOBBY] Game ${gameId} not found`);
      return;
    }

    if (game.status === GameStatus.FINISHED) {
      console.error(`[LOBBY] Cannot join game ${gameId} because it's already finished`);
      return;
    }

    if (game.status === GameStatus.PLAYING) {
      console.error(`[LOBBY] Cannot join game ${gameId} because it's already started`);
      return;
    }

    let room = await gameRoomManager.getGameRoom(gameId);

    if (!room) {
      console.log(`[LOBBY] Creating new game room ${gameId}`);
      room = await gameRoomManager.createGameRoom(gameId);
    }

    if (room.players.size >= 6) {
      console.error(`[LOBBY] Cannot join game ${gameId} because it's already full`);
      this.socket.emit("game_full", { gameId });
      return;
    }

    this.socket.join(gameId);

    await gameRoomManager.addPlayer(gameId, { ...player, socketId: this.socket.id }, game.betAmount > 0);

    console.log(`[LOBBY] Player ${player.fid} joined game ${gameId}`);
    this.emitToGame(gameId, "player_joined", { player });
    this.emitToGame(gameId, "game_update", {
      players: Array.from(room.players.values()),
    });
  }
}

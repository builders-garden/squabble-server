import { Server, Socket } from "socket.io";
import { SocketHandler } from "./SocketHandler";
import { getGameById } from "../lib/prisma/games";

interface PlayerReadyData {
  player: { fid: string };
  gameId: string;
}

export class PlayerReadyHandler extends SocketHandler {
  async handle({ player, gameId }: PlayerReadyData) {
    console.log(`[LOBBY] Player ${player.fid} marked as ready in game ${gameId}`);
    
    const game = await getGameById(gameId);
    if (!game) {
      console.error(`[LOBBY] Game ${gameId} not found`);
      return;
    }

    this.updateGame(gameId, (room) => {
      const playerData = room.players.get(player.fid);
      if (playerData) {
        playerData.ready = true;
      }
    });
  }
} 
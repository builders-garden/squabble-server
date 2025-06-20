import { Server, Socket } from "socket.io";
import { gameRoomManager } from "../game-room-manager.js";
import { SocketHandler } from "./SocketHandler.js";

export class PlayerLeaveHandler extends SocketHandler {
  constructor(socket: Socket, io: Server) {
    super(socket, io);
  }

  async handle({ playerId, gameId }: { playerId: number; gameId?: string }): Promise<void> {
    console.log(`[CONNECTION] Player ${playerId} is leaving game: ${gameId}`);
    await this.playerLeave(playerId, gameId);
    console.log(`[CONNECTION] Player ${playerId} left game: ${gameId}`);
  }

  private async playerLeave(playerId: number, gameId?: string): Promise<void> {
    // Get all rooms the socket is in
    const gameRoomIds = await gameRoomManager.getActiveGames();

    // Disconnect from each game room
    for (const gameRoomId of gameRoomIds) {
      if (gameId && gameRoomId !== gameId) {
        continue;
      }
      const gameRoom = await gameRoomManager.getGameRoom(gameRoomId);
      if (!gameRoom) {
        console.error(`[CONNECTION] Game room ${gameRoomId} not found`);
        continue;
      }
      // Find and remove the player with matching socketId
      for (const [fid, player] of gameRoom.players.entries()) {
        console.log(
          `[CONNECTION] Disconnecting player: ${player?.socketId} from game: ${gameRoom}`
        );
        if (player.fid === playerId) {
          // Use GameRoomManager to remove the player
          await gameRoomManager.removePlayer(gameRoomId, fid);

          // Notify other players
          this.emitToGame(gameRoomId, "player_left", { playerId: playerId });
          this.emitToGame(gameRoomId, "game_update", {
            players: Array.from(gameRoom.players.values()),
          });
          break; // Break since a player can only be in one room
        }
      }
    }
  }
}

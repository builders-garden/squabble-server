import { Server, Socket } from "socket.io";
import { gameRoomManager } from "../game-room-manager.js";
import { SocketHandler } from "./SocketHandler.js";

export class DisconnectPlayerHandler extends SocketHandler {
  constructor(socket: Socket, io: Server) {
    super(socket, io);
  }

  async handle(): Promise<void> {
    console.log(`[CONNECTION] Disconnecting player: ${this.socket.id}`);
    await this.disconnectPlayer(this.socket.id);
    console.log(`[CONNECTION] Disconnected player: ${this.socket.id}`);
  }

  private async disconnectPlayer(socketId: string): Promise<void> {
    // Get all rooms the socket is in
    const rooms = Array.from(this.socket.rooms);

    // Remove the socket's own room (which is the socket ID)
    const gameRooms = rooms.filter((room) => room !== socketId);

    // Disconnect from each game room
    for (const gameId of gameRooms) {
      const room = await gameRoomManager.getGameRoom(gameId);
      if (room) {
        // Find and remove the player with matching socketId
        for (const [fid, player] of room.players.entries()) {
          if (player.socketId === socketId) {
            // Use GameRoomManager to remove the player
            await gameRoomManager.removePlayer(gameId, fid);

            // Notify other players
            this.emitToGame(gameId, "player_left", { playerId: socketId });
            this.emitToGame(gameId, "game_update", {
              players: Array.from(room.players.values()),
            });
            break; // Break since a player can only be in one room
          }
        }
      }
    }
  }
}

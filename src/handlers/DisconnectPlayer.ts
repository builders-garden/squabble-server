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
    const gameRoomIds = await gameRoomManager.getActiveGames();

    // Disconnect from each game room
    for (const gameRoomId of gameRoomIds) {
      console.log(
        `[CONNECTION] Disconnecting player: ${socketId} from game: ${gameRoomId}`
      );
      const gameRoom = await gameRoomManager.getGameRoom(gameRoomId);
      if (!gameRoom) {
        console.error(`[CONNECTION] Game room ${gameRoomId} not found`);
        continue;
      }
      console.log(
        `[CONNECTION] Game room ${gameRoomId} found with players: ${JSON.stringify(
          Array.from(gameRoom.players.values())
        )}`
      );
      // Find and remove the player with matching socketId
      for (const [fid, player] of gameRoom.players.entries()) {
        console.log(
          `[CONNECTION] Disconnecting player: ${player?.socketId} from game: ${gameRoom}`
        );
        if (player.socketId === socketId) {
          // Use GameRoomManager to remove the player
          await gameRoomManager.removePlayer(gameRoomId, fid);

          // Notify other players
          this.emitToGame(gameRoomId, "player_left", { playerId: socketId });
          this.emitToGame(gameRoomId, "game_update", {
            players: Array.from(gameRoom.players.values()),
          });
          break; // Break since a player can only be in one room
        }
      }
    }
  }
}

import { Server, Socket } from "socket.io";
import { gameRoomManager } from "../game-room-manager";

export class SocketHandler {
  protected socket: Socket;
  protected io: Server;

  constructor(socket: Socket, io: Server) {
    this.socket = socket;
    this.io = io;
  }

  protected emitToGame(gameId: string, event: string, data: any) {
    this.io.to(gameId).emit(event, data);
  }

  protected getGame(gameId: string) {
    return gameRoomManager.getGameRoom(gameId);
  }

  protected updateGame(gameId: string, updateFn: (room: any) => void) {
    const room = this.getGame(gameId);
    if (room) {
      updateFn(room);
      this.emitToGame(gameId, "game_update", {
        players: Array.from(room.players.values()),
      });
    }
  }
}

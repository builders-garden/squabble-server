import { Server, Socket } from "socket.io";

export class SocketHandler {
  protected socket: Socket;
  protected io: Server;

  constructor(socket: Socket, io: Server) {
    this.socket = socket;
    this.io = io;
  }

  protected emitToGame(gameId: string, event: string, data: any) {
    console.log(
      `[EMITTING] To ${gameId}: ${event}, ${JSON.stringify(data, null, 2)}`
    );
    this.io.to(gameId).emit(event, data);
  }
}

import type { Server, Socket } from "socket.io";
import type { ServerToClientEvents } from "../types/socket/server-to-client.js";
import type { ServerToClientSocketEvents } from "../types/socket/socket.enum.js";

export class SocketHandler {
	protected socket: Socket;
	protected io: Server;

	constructor(socket: Socket, io: Server) {
		this.socket = socket;
		this.io = io;
	}

	protected emitToGame<E extends ServerToClientSocketEvents>(
		gameId: string,
		event: E,
		data: ServerToClientEvents[E],
	) {
		console.log(
			`[EMITTING] To ${gameId}: ${event}, ${JSON.stringify(data, null, 2)}`,
		);
		this.io.to(gameId).emit(event, data);
	}
}

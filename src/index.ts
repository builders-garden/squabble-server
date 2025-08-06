import { EventEmitter } from "node:events";
import { createServer } from "node:http";
import cookieParserMiddleware from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morganLogger from "morgan";
import { Server as SocketIOServer } from "socket.io";
import { ConnectToLobbyHandler } from "./handlers/ConnectToLobby";
import { DisconnectPlayerHandler } from "./handlers/DisconnectPlayer";
import { PlaceLetterHandler } from "./handlers/PlaceLetterHandler";
import { PlayerStakeConfirmedHandler } from "./handlers/PlayerStakeConfirmedHandler";
import { PlayerStakeRefundedHandler } from "./handlers/PlayerStakeRefundedHandlers";
import { RefreshAvailableLetters } from "./handlers/RefreshAvailableLetters";
import { RemoveLetterHandler } from "./handlers/RemoveLetterHandler";
import { StartGameHandler } from "./handlers/StartGameHandler";
import { SubmitWordHandler } from "./handlers/SubmitWordHandler";
import { baseOrigins, localOrigins } from "./lib/cors";
import { env } from "./lib/env";
import { setIOInstance } from "./lib/socket";
import { handleError, handleNotFound } from "./middleware/error.middleware";
import responseMiddleware from "./middleware/response";
import type {
	ConnectToLobbyEvent,
	PlaceLetterEvent,
	PlayerStakeConfirmedEvent,
	PlayerStakeRefundedEvent,
	RefreshAvailableLettersEvent,
	RemoveLetterEvent,
	StartGameEvent,
	SubmitWordEvent,
} from "./types/socket";
import { ClientToServerSocketEvents } from "./types/socket/socket.enum";

// Load environment variables
dotenv.config();

// Increase the maximum number of listeners
EventEmitter.defaultMaxListeners = 20;

const app = express();

const allowedOrigins =
	env.NODE_ENV === "development"
		? [...baseOrigins, ...localOrigins]
		: baseOrigins;

// Middleware
app.use(
	cors({
		origin: allowedOrigins,
		credentials: true,
		methods: ["GET", "POST", "OPTIONS"],
	}),
);
app.use(cookieParserMiddleware());
app.use(express.json());
app.use(helmet());
app.use(morganLogger("dev"));
app.use(responseMiddleware);

// Create HTTP server to attach socket.io
const httpServer = createServer(app);

// Initialize Socket.IO server
const io = new SocketIOServer(httpServer, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

// Set the Socket.IO instance
setIOInstance(io);

// Basic route
app.get("/", (_req, res) => {
	res.json({ message: "Server is running" });
});

// Socket.io connection handling
io.on("connection", (socket) => {
	console.log("Client connected:", socket.id);

	// 📥 Received Events Handlers
	socket.on(
		ClientToServerSocketEvents.CONNECT_TO_LOBBY,
		async ({ player, gameId }: ConnectToLobbyEvent) => {
			const handler = new ConnectToLobbyHandler(socket, io);
			await handler.handle({ player, gameId });
		},
	);

	socket.on(
		ClientToServerSocketEvents.PLAYER_STAKE_CONFIRMED,
		({
			player,
			gameId,
			paymentHash,
			payerAddress,
		}: PlayerStakeConfirmedEvent) => {
			const handler = new PlayerStakeConfirmedHandler(socket, io);
			handler.handle({ player, gameId, paymentHash, payerAddress });
		},
	);

	socket.on(
		ClientToServerSocketEvents.PLAYER_STAKE_REFUNDED,
		({ player, gameId, transactionHash }: PlayerStakeRefundedEvent) => {
			const handler = new PlayerStakeRefundedHandler(socket, io);
			handler.handle({ player, gameId, transactionHash });
		},
	);

	socket.on(
		ClientToServerSocketEvents.START_GAME,
		({ player, gameId }: StartGameEvent) => {
			const handler = new StartGameHandler(socket, io);
			handler.handle({ player, gameId });
		},
	);

	socket.on(
		ClientToServerSocketEvents.SUBMIT_WORD,
		({ player, gameId, word, path, isNew, placedLetters }: SubmitWordEvent) => {
			const handler = new SubmitWordHandler(socket, io);
			handler.handle({ player, gameId, word, path, isNew, placedLetters });
		},
	);

	socket.on(
		ClientToServerSocketEvents.PLACE_LETTER,
		({ player, gameId, x, y, letter }: PlaceLetterEvent) => {
			const handler = new PlaceLetterHandler(socket, io);
			handler.handle({ player, gameId, x, y, letter });
		},
	);

	socket.on(
		ClientToServerSocketEvents.REMOVE_LETTER,
		({ player, gameId, x, y }: RemoveLetterEvent) => {
			const handler = new RemoveLetterHandler(socket, io);
			handler.handle({ player, gameId, x, y });
		},
	);

	socket.on(
		ClientToServerSocketEvents.REFRESH_AVAILABLE_LETTERS,
		({ playerId, gameId }: RefreshAvailableLettersEvent) => {
			const handler = new RefreshAvailableLetters(socket, io);
			handler.handle({ playerId, gameId });
		},
	);

	socket.on("disconnect", async () => {
		const handler = new DisconnectPlayerHandler(socket, io);
		await handler.handle();
	});
});

// Health check route (unprotected)
app.get("/health", (_req, res) => {
	res.json({ status: "ok" });
});

// Use custom middlewares for handling 404 and errors
app.use(handleNotFound);
app.use(handleError);

// Start server
httpServer.listen(env.PORT, () => {
	console.log(`Server is running on port ${env.PORT}`);
});

import dotenv from "dotenv";
import { EventEmitter } from "events";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { ConnectToLobbyHandler } from "./handlers/ConnectToLobby.js";
import { DisconnectPlayerHandler } from "./handlers/DisconnectPlayer.js";
import { PlaceLetterHandler } from "./handlers/PlaceLetterHandler.js";
import { PlayerStakeConfirmedHandler } from "./handlers/PlayerStakeConfirmedHandler.js";
import { RefreshAvailableLetters } from "./handlers/RefreshAvailableLetters.js";
import { RemoveLetterHandler } from "./handlers/RemoveLetterHandler.js";
import { StartGameHandler } from "./handlers/StartGameHandler.js";
import { SubmitWordHandler } from "./handlers/SubmitWordHandler.js";
import { PlayerLeaveHandler } from "./handlers/PlayerLeaveHandler.js";
import { PlayerStakeRefundedHandler } from "./handlers/PlayerStakeRefundedHandlers.js";

// Load environment variables
dotenv.config();

// Increase the maximum number of listeners
EventEmitter.defaultMaxListeners = 20;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3001;

// Basic Express middleware
app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // 📥 Received Events Handlers
  socket.on("connect_to_lobby", async ({ player, gameId }) => {
    const handler = new ConnectToLobbyHandler(socket, io);
    await handler.handle({ player, gameId });
  });

  socket.on("leave", async ({ playerId, gameId }) => {
    const handler = new PlayerLeaveHandler(socket, io);
    await handler.handle({ playerId, gameId });
  });

  socket.on("player_stake_confirmed", ({ player, gameId, paymentHash, payerAddress }) => {
    const handler = new PlayerStakeConfirmedHandler(socket, io);
    handler.handle({ player, gameId, paymentHash, payerAddress });
  });

  socket.on("player_stake_refunded", ({ player, gameId, transactionHash }) => {
    const handler = new PlayerStakeRefundedHandler(socket, io);
    handler.handle({ player, gameId, transactionHash });
  });

  socket.on("start_game", ({ player, gameId }) => {
    const handler = new StartGameHandler(socket, io);
    handler.handle({ player, gameId });
  });

  socket.on("place_letter", ({ player, gameId, x, y, letter }) => {
    const handler = new PlaceLetterHandler(socket, io);
    handler.handle({ player, gameId, x, y, letter });
  });

  socket.on("remove_letter", ({ player, gameId, x, y }) => {
    const handler = new RemoveLetterHandler(socket, io);
    handler.handle({ player, gameId, x, y });
  });

  socket.on("submit_word", ({ player, gameId, word, path, isNew, placedLetters }) => {
    const handler = new SubmitWordHandler(socket, io);
    handler.handle({ player, gameId, word, path, isNew, placedLetters });
  });

  socket.on("refresh_available_letters", ({ playerId, gameId }) => {
    const handler = new RefreshAvailableLetters(socket, io);
    handler.handle({ playerId, gameId });
  });

  socket.on("disconnect", async () => {
    const handler = new DisconnectPlayerHandler(socket, io);
    await handler.handle();
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

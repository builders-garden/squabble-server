import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { ConnectToLobbyHandler } from "./handlers/ConnectToLobby.js";
import { DisconnectPlayerHandler } from "./handlers/DisconnectPlayer.js";
import { PlaceLetterHandler } from "./handlers/PlaceLetterHandler.js";
import { PlayerStakeConfirmedHandler } from "./handlers/PlayerStakeConfirmedHandler.js";
import { RemoveLetterHandler } from "./handlers/RemoveLetterHandler.js";
import { StartGameHandler } from "./handlers/StartGameHandler.js";
import { SubmitWordHandler } from "./handlers/SubmitWordHandler.js";
import { RefreshAvailableLetters } from "./handlers/RefreshAvailableLetters.js";

// Load environment variables
dotenv.config();

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

  socket.on("player_stake_confirmed", ({ player, gameId, paymentHash }) => {
    const handler = new PlayerStakeConfirmedHandler(socket, io);
    handler.handle({ player, gameId, paymentHash });
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

  socket.on("submit_word", ({ player, gameId, word, path, isNew }) => {
    const handler = new SubmitWordHandler(socket, io);
    handler.handle({ player, gameId, word, path, isNew });
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

// Helper function to calculate word score
function calculateWordScore(word: string): number {
  // TODO: Implement proper word scoring logic
  return word.length;
}

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3001;

// Game state tracking
interface Player {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  ready: boolean;
  staked: boolean;
  score: number;
}

interface GameRoom {
  players: Map<string, Player>;
  board: string[][];
  timer: NodeJS.Timeout | null;
  timeRemaining: number;
}

const gameRooms = new Map<string, GameRoom>();

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
  socket.on("connect_to_lobby", ({ player, gameId }) => {
    console.log("player", player);
    console.log(`[LOBBY] Player ${player.fid} connecting to game ${gameId}`);
    socket.join(gameId);
    if (!gameRooms.has(gameId)) {
      console.log(`[LOBBY] Creating new game room ${gameId}`);
      gameRooms.set(gameId, {
        players: new Map(),
        board: Array(15)
          .fill(null)
          .map(() => Array(15).fill("")),
        timer: null,
        timeRemaining: 300, // 5 minutes
      });
    }
    const room = gameRooms.get(gameId)!;
    room.players.set(player.fid, {
      id: player.fid,
      username: player.username,
      avatarUrl: player.avatarUrl,
      displayName: player.displayName,
      ready: false,
      staked: false,
      score: 0,
    });
    console.log(`[LOBBY] Player ${player.fid} joined game ${gameId}`);
    io.to(gameId).emit("player_joined", { player });
    io.to(gameId).emit("game_update", {
      players: Array.from(room.players.values()),
    });
  });

  socket.on("player_ready", (roomId) => {
    console.log(
      `[LOBBY] Player ${socket.id} marked as ready in game ${roomId}`
    );
    const room = gameRooms.get(roomId);
    if (room) {
      const player = room.players.get(socket.id);
      if (player) {
        player.ready = true;
        io.to(roomId).emit("lobby_update", {
          players: Array.from(room.players.values()),
        });
      }
    }
  });

  socket.on("player_stake_confirmed", (roomId) => {
    console.log(
      `[LOBBY] Player ${socket.id} confirmed stake in game ${roomId}`
    );
    const room = gameRooms.get(roomId);
    if (room) {
      const player = room.players.get(socket.id);
      if (player) {
        player.staked = true;
        io.to(roomId).emit("lobby_update", {
          players: Array.from(room.players.values()),
        });
      }
    }
  });

  socket.on("start_game", (roomId) => {
    console.log(`[GAME] Starting game ${roomId}`);
    const room = gameRooms.get(roomId);
    if (room) {
      // Start game timer
      room.timer = setInterval(() => {
        room.timeRemaining--;
        io.to(roomId).emit("timer_tick", room.timeRemaining);
        if (room.timeRemaining <= 0) {
          console.log(`[GAME] Game ${roomId} ended due to time expiration`);
          clearInterval(room.timer!);
          io.to(roomId).emit("game_ended");
        }
      }, 1000);

      io.to(roomId).emit("game_started", {
        board: room.board,
        timeRemaining: room.timeRemaining,
      });
    }
  });

  socket.on("place_letter", ({ roomId, position, letter }) => {
    console.log(
      `[GAME] Player ${socket.id} placing letter "${letter}" at position [${position}] in game ${roomId}`
    );
    const room = gameRooms.get(roomId);
    if (room) {
      const [row, col] = position;
      if (room.board[row][col] === "") {
        room.board[row][col] = letter;
        io.to(roomId).emit("letter_placed", {
          position,
          letter,
          playerId: socket.id,
        });
      }
    }
  });

  socket.on("remove_letter", ({ roomId, position }) => {
    console.log(
      `[GAME] Player ${socket.id} removing letter at position [${position}] in game ${roomId}`
    );
    const room = gameRooms.get(roomId);
    if (room) {
      const [row, col] = position;
      if (room.board[row][col] !== "") {
        room.board[row][col] = "";
        io.to(roomId).emit("letter_removed", {
          position,
          playerId: socket.id,
        });
      }
    }
  });

  socket.on("submit_word", ({ roomId, word, positions }) => {
    console.log(
      `[GAME] Player ${socket.id} submitting word "${word}" in game ${roomId}`
    );
    const room = gameRooms.get(roomId);
    if (room) {
      // TODO: Implement word validation and scoring logic
      const score = calculateWordScore(word); // Implement this function
      const player = room.players.get(socket.id);
      if (player) {
        player.score += score;
        console.log(
          `[GAME] Word "${word}" scored ${score} points for player ${socket.id}`
        );
        io.to(roomId).emit("word_submitted", {
          word,
          score,
          playerId: socket.id,
        });
        io.to(roomId).emit("score_update", {
          players: Array.from(room.players.values()),
        });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`[CONNECTION] Client disconnected: ${socket.id}`);
    // Find and clean up any rooms the player was in
    gameRooms.forEach((room, roomId) => {
      if (room.players.has(socket.id)) {
        console.log(`[LOBBY] Removing player ${socket.id} from game ${roomId}`);
        room.players.delete(socket.id);
        io.to(roomId).emit("player_left", { playerId: socket.id });
        io.to(roomId).emit("lobby_update", {
          players: Array.from(room.players.values()),
        });

        // Clean up empty rooms
        if (room.players.size === 0) {
          console.log(`[LOBBY] Cleaning up empty game room ${roomId}`);
          if (room.timer) {
            clearInterval(room.timer);
          }
          gameRooms.delete(roomId);
        }
      }
    });
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

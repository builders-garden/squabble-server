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
  socket.on("connect_to_lobby", (roomId) => {
    socket.join(roomId);
    if (!gameRooms.has(roomId)) {
      gameRooms.set(roomId, {
        players: new Map(),
        board: Array(15)
          .fill(null)
          .map(() => Array(15).fill("")),
        timer: null,
        timeRemaining: 300, // 5 minutes
      });
    }
    const room = gameRooms.get(roomId)!;
    room.players.set(socket.id, {
      id: socket.id,
      ready: false,
      staked: false,
      score: 0,
    });
    io.to(roomId).emit("player_joined", { playerId: socket.id });
    io.to(roomId).emit("lobby_update", {
      players: Array.from(room.players.values()),
    });
  });

  socket.on("player_ready", (roomId) => {
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
    const room = gameRooms.get(roomId);
    if (room) {
      // Start game timer
      room.timer = setInterval(() => {
        room.timeRemaining--;
        io.to(roomId).emit("timer_tick", room.timeRemaining);
        if (room.timeRemaining <= 0) {
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
    const room = gameRooms.get(roomId);
    if (room) {
      // TODO: Implement word validation and scoring logic
      const score = calculateWordScore(word); // Implement this function
      const player = room.players.get(socket.id);
      if (player) {
        player.score += score;
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
    console.log("Client disconnected:", socket.id);
    // Find and clean up any rooms the player was in
    gameRooms.forEach((room, roomId) => {
      if (room.players.has(socket.id)) {
        room.players.delete(socket.id);
        io.to(roomId).emit("player_left", { playerId: socket.id });
        io.to(roomId).emit("lobby_update", {
          players: Array.from(room.players.values()),
        });

        // Clean up empty rooms
        if (room.players.size === 0) {
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

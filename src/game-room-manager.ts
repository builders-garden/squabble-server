import { GameStatus } from "@prisma/client";
import { GameRoom, Player } from "./interfaces.js";
import { fetchUsersByFids } from "./lib/neynar/index.js";
import {
  createGameParticipant,
  getGameParticipantByFidAndGameId,
  updateGameParticipant,
  updateGameParticipantPoints,
} from "./lib/prisma/game-participants/index.js";
import { getGameById, updateGame } from "./lib/prisma/games/index.js";
import { redisClient } from "./lib/redis/index.js";
import { joinGame } from "./lib/viem/index.js";
import { getRandomWord } from "./lib/words.js";

export class GameRoomManager {
  private static instance: GameRoomManager;
  private gameRooms: Map<string, GameRoom>;
  private readonly REDIS_PREFIX = "game_room:";
  private readonly REDIS_TTL = 604800; // 7 days in seconds

  private constructor() {
    this.gameRooms = new Map();
  }

  public static getInstance(): GameRoomManager {
    if (!GameRoomManager.instance) {
      GameRoomManager.instance = new GameRoomManager();
    }
    return GameRoomManager.instance;
  }

  private async saveToRedis(gameId: string, room: GameRoom): Promise<void> {
    const serializedRoom = JSON.stringify({
      players: Array.from(room.players.entries()),
      board: room.board,
      timeRemaining: room.timeRemaining,
      contractGameId: room.contractGameId,
      conversationId: room.conversationId,
    });
    await redisClient.setEx(
      `${this.REDIS_PREFIX}${gameId}`,
      this.REDIS_TTL,
      serializedRoom
    );
  }

  private async loadFromRedis(gameId: string): Promise<GameRoom | null> {
    const serializedRoom = await redisClient.get(
      `${this.REDIS_PREFIX}${gameId}`
    );
    if (!serializedRoom) return null;

    const parsedRoom = JSON.parse(serializedRoom);

    // Safely reconstruct the players Map
    let players: Map<number, any> = new Map();
    if (parsedRoom.players && Array.isArray(parsedRoom.players)) {
      try {
        // Filter out any null or invalid entries
        const validEntries = parsedRoom.players.filter(Boolean);
        players = new Map(validEntries);
      } catch (error) {
        console.warn(
          `Failed to reconstruct players Map for game ${gameId}:`,
          error
        );
        players = new Map();
      }
    }

    return {
      players,
      board: parsedRoom.board,
      timer: null,
      timeRemaining: parsedRoom.timeRemaining,
      contractGameId: parsedRoom.contractGameId,
      conversationId: parsedRoom.conversationId,
    };
  }

  public async createGameRoom(gameId: string): Promise<GameRoom> {
    const game = await getGameById(gameId);
    if (!game || !game.contractGameId) {
      throw new Error("Game doesn't exist on database");
    }
    const room: GameRoom = {
      players: new Map(),
      board: Array(10)
        .fill(null)
        .map(() => Array(10).fill("")),
      timer: null,
      timeRemaining: 300, // 5 minutes
      contractGameId: game.contractGameId || 0,
      conversationId: game.conversationId || "",
    };
    this.gameRooms.set(gameId, room);
    await this.saveToRedis(gameId, room);
    return room;
  }

  public async getGameRoom(gameId: string): Promise<GameRoom | undefined> {
    let room = this.gameRooms.get(gameId);
    if (!room) {
      const redisRoom = await this.loadFromRedis(gameId);
      if (redisRoom) {
        this.gameRooms.set(gameId, redisRoom);
        room = redisRoom;
      }
    }
    return room;
  }

  public async addPlayer(
    gameId: string,
    gameContractId: number,
    player: Player,
    isPaidGame: boolean
  ): Promise<void> {
    const room = await this.getGameRoom(gameId);
    if (room) {
      const gameParticipant = await getGameParticipantByFidAndGameId(
        player.fid,
        gameId
      );
      let address = player.address;
      if (!address && !isPaidGame) {
        const neynarUser = await fetchUsersByFids([player.fid]);
        address = neynarUser[0].verified_addresses.primary
          .eth_address as `0x${string}`;
      }
      console.log("gameParticipant", {
        gameParticipant,
        roomPlayer: room.players.get(player.fid),
        playerFid: player.fid,
      });
      const playerAlreadyJoined =
        !!gameParticipant || room.players.get(player.fid)?.fid === player.fid;
      const isPlayerAlreadyReady = gameParticipant?.paid || player.ready;
      if (gameParticipant) {
        player.ready = isPaidGame ? gameParticipant.paid : true;
      }
      if (!isPaidGame && !player.ready) {
        player.ready = true;
      }

      room.players.set(player.fid, player);
      if (!playerAlreadyJoined && !isPaidGame) {
        console.log("joining game", {
          player: player.fid,
          gameContractId,
          address,
        });
        await joinGame(gameContractId, address);
      }
      await this.saveToRedis(gameId, room);
      await createGameParticipant({
        fid: Number(player.fid),
        gameId,
        address,
        joined: gameParticipant?.joined || true,
        paid: gameParticipant?.paid || false,
        winner: gameParticipant?.winner || false,
        paymentHash: gameParticipant?.paymentHash || "",
      });
    }
  }

  public async removePlayer(gameId: string, playerFid: number): Promise<void> {
    const room = await this.getGameRoom(gameId);
    if (room) {
      room.players.delete(playerFid);
      await this.saveToRedis(gameId, room);

      // Clean up empty rooms
      if (room.players.size === 0) {
        const game = await getGameById(gameId);
        if (game?.status === GameStatus.PLAYING) {
          await updateGame(gameId, {
            status: GameStatus.FINISHED,
          });
        }
      }
    }
  }

  public async updatePlayerStakeRefunded(
    gameId: string,
    playerFid: number
  ): Promise<void> {
    const room = await this.getGameRoom(gameId);
    if (room) {
      const player = room.players.get(playerFid);
      if (player) {
        player.ready = false;
        await updateGameParticipant(Number(playerFid), gameId, {
          paid: false,
          paymentHash: "",
          address: "",
        });
        room.players.set(playerFid, player);
        await this.saveToRedis(gameId, room);
      }
    }
  }

  public async updatePlayerReady(
    gameId: string,
    playerFid: number,
    ready: boolean,
    paymentHash: string,
    address: string
  ): Promise<void> {
    const room = await this.getGameRoom(gameId);
    if (room) {
      const player = room.players.get(playerFid);
      if (player) {
        player.ready = ready;
        await updateGameParticipant(Number(playerFid), gameId, {
          paid: true,
          paymentHash,
          address,
        });
        room.players.set(playerFid, player);
        await this.saveToRedis(gameId, room);
      }
    }
  }

  public async updateBoard(
    gameId: string,
    playerFid: number,
    word: string,
    path: { x: number; y: number }[]
  ): Promise<string[][]> {
    const room = await this.getGameRoom(gameId);
    if (room) {
      // Place each letter of the word on the board according to the path
      for (let i = 0; i < word.length; i++) {
        const { x, y } = path[i];
        room.board[y][x] = word[i];
      }
      await this.saveToRedis(gameId, room);
      return room.board;
    }
    return [];
  }

  public async updatePlayerScore(
    gameId: string,
    playerFid: number,
    score: number
  ): Promise<GameRoom> {
    const room = await this.getGameRoom(gameId);
    if (!room) throw new Error("Room not found");
    const player = room.players.get(playerFid);
    if (player) {
      player.score = score;
      await Promise.all([
        this.saveToRedis(gameId, room),
        updateGameParticipantPoints(playerFid, gameId, score),
      ]);
    }
    return room;
  }

  public async endGame(gameId: string): Promise<void> {
    const room = await this.getGameRoom(gameId);
    if (!room) throw new Error("Room not found");

    // Clear any existing timer
    if (room.timer) {
      clearInterval(room.timer);
    }

    // Update game status in DB
    await updateGame(gameId, {
      status: GameStatus.FINISHED,
      totalFunds: Array.from(room.players.values()).reduce(
        (sum, player) => sum + player.score,
        0
      ),
    });

    // Remove from Redis and memory
    await redisClient.del(`${this.REDIS_PREFIX}${gameId}`);
    this.gameRooms.delete(gameId);
  }

  public async startGameTimer(
    gameId: string,
    onTick: (timeRemaining: number) => void,
    onEnd: () => void
  ): Promise<void> {
    const room = await this.getGameRoom(gameId);
    if (!room) throw new Error("Room not found");
    // Clear any existing timer
    if (room.timer) {
      clearInterval(room.timer);
    }

    room.timer = setInterval(async () => {
      room.timeRemaining--;
      await this.saveToRedis(gameId, room);
      onTick(room.timeRemaining);

      if (room.timeRemaining <= 0) {
        clearInterval(room.timer!);
        onEnd();
      }
    }, 1000);
  }

  public async initBoard(gameId: string): Promise<void> {
    const room = await this.getGameRoom(gameId);
    if (!room) {
      throw new Error("Room not found");
    }
    room.board = Array.from({ length: 10 }, () => Array(10).fill(""));
    const randomWord = getRandomWord(4, 5);
    const center = Math.floor(room.board.length / 2);

    // Place each letter of the word horizontally starting from center
    for (let i = 0; i < randomWord.length; i++) {
      room.board[center][center - Math.floor(randomWord.length / 2) + i] =
        randomWord[i];
    }
    await this.saveToRedis(gameId, room);
  }

  public async getActiveGames(): Promise<string[]> {
    const keys = await redisClient.keys(`${this.REDIS_PREFIX}*`);
    return keys.map((key: string) => key.replace(this.REDIS_PREFIX, ""));
  }

  public async getGamePlayers(gameId: string): Promise<Player[]> {
    const room = await this.getGameRoom(gameId);
    return room ? Array.from(room.players.values()) : [];
  }

  public async disconnectPlayer(
    gameId: string,
    socketId: string
  ): Promise<void> {
    const room = await this.getGameRoom(gameId);
    if (room) {
      room.players.forEach((player, fid) => {
        if (player.socketId === socketId) {
          this.removePlayer(gameId, fid);
        }
      });
    }
  }
}

// Export a singleton instance
export const gameRoomManager = GameRoomManager.getInstance();

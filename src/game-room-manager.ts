import { GameStatus } from "@prisma/client";
import { GameRoom, Player } from "./interfaces";
import { createGameParticipant, updateGameParticipant } from "./lib/prisma/game-participants";
import { getGameById, updateGame } from "./lib/prisma/games";

export class GameRoomManager {
  private static instance: GameRoomManager;
  private gameRooms: Map<string, GameRoom>;

  private constructor() {
    this.gameRooms = new Map();
  }

  public static getInstance(): GameRoomManager {
    if (!GameRoomManager.instance) {
      GameRoomManager.instance = new GameRoomManager();
    }
    return GameRoomManager.instance;
  }

  public async createGameRoom(gameId: string): Promise<GameRoom> {
    const room: GameRoom = {
      players: new Map(),
      board: Array(10)
        .fill(null)
        .map(() => Array(10).fill("")),
      timer: null,
      timeRemaining: 300, // 5 minutes
    };
    console.log("room", room);
    this.gameRooms.set(gameId, room);
    return room;
  }

  public getGameRoom(gameId: string): GameRoom | undefined {
    return this.gameRooms.get(gameId);
  }

  public async addPlayer(gameId: string, player: Player): Promise<void> {
    const room = this.getGameRoom(gameId);
    if (room) {
      room.players.set(player.fid, player);
      await createGameParticipant({
        fid: Number(player.fid),
        gameId,
        joined: true,
        paid: false,
        winner: false,
        paymentHash: "",
      });
    }
  }

  public removePlayer(gameId: string, playerFid: string): void {
    const room = this.getGameRoom(gameId);
    if (room) {
      room.players.delete(playerFid);

      // Clean up empty rooms
      if (room.players.size === 0) {
        this.endGame(gameId);
      }
    }
  }

  public async updatePlayerReady(gameId: string, playerFid: string, ready: boolean): Promise<void> {
    const room = this.getGameRoom(gameId);
    if (room) {
      const player = room.players.get(playerFid);
      if (player) {
        player.ready = ready;
        room.players.set(playerFid, player);
        await updateGameParticipant(Number(playerFid), gameId, {
          paid: true,
        });
      }
    }
  }

  public updatePlayerBoard(gameId: string, playerFid: string, board: string[][]): void {
    const room = this.getGameRoom(gameId);
    if (room) {
      const player = room.players.get(playerFid);
      if (player) {
        player.board = board;
        room.players.set(playerFid, player);
      }
    }
  }

  public updatePlayerScore(
    gameId: string,
    playerFid: string,
    score: number
  ): void {
    const room = this.getGameRoom(gameId);
    if (room) {
      const player = room.players.get(playerFid);
      if (player) {
        player.score = score;
      }
    }
  }

  public async endGame(gameId: string): Promise<void> {
    const room = this.getGameRoom(gameId);
    if (room) {
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

      // Remove from memory
      this.gameRooms.delete(gameId);
    }
  }

  public startGameTimer(
    gameId: string,
    onTick: (timeRemaining: number) => void,
    onEnd: () => void
  ): void {
    const room = this.getGameRoom(gameId);
    if (room) {
      // Clear any existing timer
      if (room.timer) {
        clearInterval(room.timer);
      }

      room.timer = setInterval(() => {
        room.timeRemaining--;
        onTick(room.timeRemaining);

        if (room.timeRemaining <= 0) {
          clearInterval(room.timer!);
          onEnd();
        }
      }, 1000);
    }
  }

  public updateBoard(
    gameId: string,
    x: number,
    y: number,
    letter: string
  ): void {
    const room = this.getGameRoom(gameId);
    if (room) {
      room.board[x][y] = letter;
    }
  }

  public getActiveGames(): string[] {
    return Array.from(this.gameRooms.keys());
  }

  public getGamePlayers(gameId: string): Player[] {
    const room = this.getGameRoom(gameId);
    return room ? Array.from(room.players.values()) : [];
  }

  public async disconnectPlayer(
    gameId: string,
    socketId: string
  ): Promise<void> {
    const room = this.getGameRoom(gameId);
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

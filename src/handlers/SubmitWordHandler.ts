import { Server, Socket } from "socket.io";
import { SocketHandler } from "./SocketHandler";
import { gameRoomManager } from "../game-room-manager";

interface SubmitWordData {
  player: { fid: string };
  gameId: string;
  word: string;
  path: any[];
  isNew: boolean;
}

export class SubmitWordHandler extends SocketHandler {
  handle({ player, gameId, word, path }: SubmitWordData) {
    console.log(
      `[GAME] Player ${player.fid} submitting word "${word}" in game ${gameId}`
    );

    const room = gameRoomManager.getGameRoom(gameId);
    if (!room) return;

    // TODO: Implement word validation and scoring logic
    // TODO: update room board with new word positioning
    const score = this.calculateWordScore(word);
    const playerData = room.players.get(player.fid);
    
    if (playerData) {
      playerData.score += score;
      console.log(
        `[GAME] Word "${word}" scored ${score} points for player ${player.fid}`
      );
      
      this.emitToGame(gameId, "word_submitted", {
        gameId,
        word,
        path,
        score,
        player: playerData,
        board: room.board,
      });
      
      this.emitToGame(gameId, "score_update", {
        players: Array.from(room.players.values()),
      });
    }
  }

  private calculateWordScore(word: string): number {
    // TODO: Implement proper word scoring logic
    return word.length;
  }
} 
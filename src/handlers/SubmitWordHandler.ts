import { SocketHandler } from "./SocketHandler.js";
import { gameRoomManager } from "../game-room-manager.js";
import { computeWordScore, isWordValid } from "../lib/words.js";

interface SubmitWordData {
  player: { fid: number };
  gameId: string;
  word: string;
  path: any[];
  isNew: boolean;
}

export class SubmitWordHandler extends SocketHandler {
  async handle({ player, gameId, word, path }: SubmitWordData) {
    console.log(
      `[GAME] Player ${player.fid} submitting word "${word}" in game ${gameId}`
    );

    const room = await gameRoomManager.getGameRoom(gameId);
    if (!room) return;

    // TODO: update room board with new word positioning
    const validWord = isWordValid(word);
    const playerData = room.players.get(player.fid);
    if (!validWord) {
      console.log(`[GAME] Word "${word}" is not valid`);
      this.emitToGame(gameId, "word_not_valid", {
        gameId,
        word,
        path,
        player: playerData,
        board: room.board,
      });
    }
    const score = computeWordScore(word);
    
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
} 
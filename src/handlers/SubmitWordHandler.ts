import { gameRoomManager } from "../game-room-manager.js";
import {
  computeWordScore,
  getNewWordsFormed,
  isWordValid,
} from "../lib/words.js";
import { SocketHandler } from "./SocketHandler.js";

interface SubmitWordData {
  player: { fid: number };
  gameId: string;
  word: string;
  path: { x: number; y: number }[];
  isNew: boolean;
  placedLetters: { x: number; y: number; letter: string }[];
}

export class SubmitWordHandler extends SocketHandler {
  async handle({ player, gameId, word, path, placedLetters }: SubmitWordData) {
    console.log(
      `[GAME] Player ${player.fid} submitting word "${word}" on path ${path} placed letters ${placedLetters} in game ${gameId}`
    );

    const room = await gameRoomManager.getGameRoom(gameId);
    if (!room) return;

    const playerData = room.players.get(player.fid);
    if (!playerData) return;

    // First validate the main word
    const validWord = isWordValid(word);
    if (!validWord) {
      console.log(`[GAME] Word "${word}" is not valid`);
      this.emitToGame(gameId, "word_not_valid", {
        gameId,
        word,
        path,
        player: playerData,
        board: room.board,
      });
      return;
    }

    // Create a temporary board with the new word to validate all possible words
    const tempBoard = room.board.map((row) => [...row]);
    for (let i = 0; i < word.length; i++) {
      const { x, y } = path[i];
      tempBoard[y][x] = word[i];
    }

    // Get only the new words formed by this move (main + perpendiculars)
    const newWords = getNewWordsFormed(tempBoard, path, placedLetters);
    // Validate all new words
    const invalidWords = newWords.filter((w) => !isWordValid(w));
    if (invalidWords.length > 0) {
      console.log(`[GAME] Invalid words formed: ${invalidWords.join(", ")}`);
      this.emitToGame(gameId, "adjacent_words_not_valid", {
        gameId,
        word,
        path,
        player: playerData,
        board: room.board,
      });
      return;
    }

    // Calculate total score only for new words
    const totalScore = newWords.reduce(
      (acc, w) => acc + computeWordScore(w),
      0
    );
    const newScore = totalScore + (playerData.score || 0);
    console.log(
      `[GAME] Total score: ${totalScore} for player ${player.fid} with previous score ${playerData.score}`
    );
    console.log(`[GAME] New score: ${newScore} for player ${player.fid}`);
    const updatedRoom = await gameRoomManager.updatePlayerScore(
      gameId,
      player.fid,
      newScore
    );
    console.log(
      `[GAME] New words "${newWords.join(
        ", "
      )}" scored ${totalScore} points for player ${player.fid}`
    );

    const newBoard = await gameRoomManager.updateBoard(
      gameId,
      player.fid,
      word,
      path
    );

    this.emitToGame(gameId, "word_submitted", {
      gameId,
      words: newWords,
      path,
      score: totalScore,
      player: playerData,
      board: newBoard,
      allWords: newWords,
    });

    this.emitToGame(gameId, "score_update", {
      player: playerData,
      newScore: newScore,
    });
  }
}

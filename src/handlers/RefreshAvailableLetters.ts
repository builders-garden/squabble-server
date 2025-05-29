import { gameRoomManager } from "../game-room-manager.js";
import { getRandomAvailableLetters } from "../lib/words.js";
import { SocketHandler } from "./SocketHandler.js";

export class RefreshAvailableLetters extends SocketHandler {
  handle({ playerId, gameId }: { playerId: number, gameId: string }) {
    const room = gameRoomManager.getGameRoom(gameId);
    if (!room) return;
    const player = room.players.get(playerId);
    if (!player) return;
    const updatedPlayer = {
      ...player,
      availableLetters: getRandomAvailableLetters(7)
    };
    room.players.set(playerId, updatedPlayer);

    this.emitToGame(gameId, "refreshed_available_letters", {
      gameId,
      playerId,
      players: [updatedPlayer]
    });
  }
}
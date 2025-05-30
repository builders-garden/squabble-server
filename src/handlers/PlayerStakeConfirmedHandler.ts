import { gameRoomManager } from "../game-room-manager.js";
import { SocketHandler } from "./SocketHandler.js";

interface PlayerStakeConfirmedData {
  player: { fid: number };
  gameId: string;
  paymentHash: string;
}

export class PlayerStakeConfirmedHandler extends SocketHandler {
  async handle({ player, gameId }: PlayerStakeConfirmedData) {
    console.log(
      `[LOBBY] Player ${player.fid} confirmed stake in game ${gameId}`
    );
    await gameRoomManager.updatePlayerReady(gameId, player.fid, true);
    const room = await gameRoomManager.getGameRoom(gameId);
    if (room) {
      this.emitToGame(gameId, "game_update", {
        players: Array.from(room.players.values()),
      });
    }
  }
}

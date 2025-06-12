import { gameRoomManager } from "../game-room-manager.js";
import { SocketHandler } from "./SocketHandler.js";

interface PlayerStakeRefundedData {
  player: { fid: number };
  gameId: string;
  transactionHash: string;
}

export class PlayerStakeRefundedHandler extends SocketHandler {
  async handle({ player, gameId, transactionHash }: PlayerStakeRefundedData) {
    console.log(
      `[LOBBY] Player ${player.fid} refunded stake in game ${gameId}`
    );
    await gameRoomManager.updatePlayerStakeRefunded(gameId, player.fid);
    const room = await gameRoomManager.getGameRoom(gameId);
    if (room) {
      this.emitToGame(gameId, "game_update", {
        players: Array.from(room.players.values()),
      });
    }
  }
}

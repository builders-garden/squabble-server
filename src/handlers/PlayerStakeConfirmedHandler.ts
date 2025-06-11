import { gameRoomManager } from "../game-room-manager.js";
import { getTransactionReceipt } from "../lib/viem/index.js";
import { SocketHandler } from "./SocketHandler.js";

interface PlayerStakeConfirmedData {
  player: { fid: number };
  gameId: string;
  paymentHash: string;
}

export class PlayerStakeConfirmedHandler extends SocketHandler {
  async handle({ player, gameId, paymentHash }: PlayerStakeConfirmedData) {
    console.log(
      `[LOBBY] Player ${player.fid} confirmed stake in game ${gameId}`
    );
    const receipt = await getTransactionReceipt(paymentHash as `0x${string}`);
    await gameRoomManager.updatePlayerReady(gameId, player.fid, true, paymentHash, receipt.from);
    const room = await gameRoomManager.getGameRoom(gameId);
    if (room) {
      this.emitToGame(gameId, "game_update", {
        players: Array.from(room.players.values()),
      });
    }
  }
}

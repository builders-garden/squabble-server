import { gameRoomManager } from "../game-room-manager.js";
import { sendAgentMessage } from "../lib/agent/api.js";
import { getTransactionReceipt } from "../lib/viem/index.js";
import { SocketHandler } from "./SocketHandler.js";

interface PlayerStakeConfirmedData {
  player: { fid: number, username: string };
  gameId: string;
  paymentHash: string;
  payerAddress: string;
}

export class PlayerStakeConfirmedHandler extends SocketHandler {
  async handle({ player, gameId, paymentHash, payerAddress }: PlayerStakeConfirmedData) {
    console.log(
      `[LOBBY] Player ${player.fid} confirmed stake in game ${gameId}`
    );
    await gameRoomManager.updatePlayerReady(gameId, player.fid, true, paymentHash, payerAddress);
    const room = await gameRoomManager.getGameRoom(gameId);
    if (room) {
      this.emitToGame(gameId, "game_update", {
        players: Array.from(room.players.values()),
      });

      try {
        const messageResponse = await sendAgentMessage(
          "/api/send-message",
          room.conversationId,
          `🎉 ${player.username} is ready to play!`
        );
        if (!messageResponse) {
          console.error("Failed to send player stake confirmed message");
          throw new Error("Failed to send player stake confirmed message");
        }
      } catch (error) {
        console.error("Error sending player stake confirmed message:", error);
      }
    }
  }
}

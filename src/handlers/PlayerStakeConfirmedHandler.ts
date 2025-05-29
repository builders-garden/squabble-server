import { gameRoomManager } from "../game-room-manager";
import { SocketHandler } from "./SocketHandler";

interface PlayerStakeConfirmedData {
  player: { fid: string };
  gameId: string;
  paymentHash: string;
}

export class PlayerStakeConfirmedHandler extends SocketHandler {
  async handle({ player, gameId }: PlayerStakeConfirmedData) {
    console.log(
      `[LOBBY] Player ${player.fid} confirmed stake in game ${gameId}`
    );
    await gameRoomManager.updatePlayerReady(gameId, player.fid, true);
    const room = gameRoomManager.getGameRoom(gameId);
    if (room) {
      this.emitToGame(gameId, "game_update", {
        players: Array.from(room.players.values()),
      });
    }
  }
}

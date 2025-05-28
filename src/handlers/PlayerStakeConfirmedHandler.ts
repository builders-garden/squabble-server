import { SocketHandler } from "./SocketHandler";

interface PlayerStakeConfirmedData {
  player: { fid: string };
  gameId: string;
  paymentHash: string;
}

export class PlayerStakeConfirmedHandler extends SocketHandler {
  handle({ player, gameId }: PlayerStakeConfirmedData) {
    console.log(
      `[LOBBY] Player ${player.fid} confirmed stake in game ${gameId}`
    );

    this.updateGame(gameId, (room) => {
      const playerData = room.players.get(player.fid);
      if (playerData) {
        playerData.ready = true;
        room.players.set(player.fid, playerData);
      }
    });
  }
}

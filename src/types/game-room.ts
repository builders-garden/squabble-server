import type { Player } from "./player.js";

export interface GameRoom {
	players: Map<number, Player>;
	board: string[][];
	timer: NodeJS.Timeout | null;
	timeRemaining: number;
	contractGameId: number;
	conversationId: string;
}

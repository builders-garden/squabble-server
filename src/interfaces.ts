export interface Player {
  socketId: string;
  fid: number;
  displayName: string;
  username: string;
  avatarUrl: string;
  ready: boolean;
  score: number;
  board: string[][];
}

export interface GameRoom {
  players: Map<number, Player>;
  board: string[][];
  timer: NodeJS.Timeout | null;
  timeRemaining: number;
}

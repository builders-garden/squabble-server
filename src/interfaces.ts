export interface Player {
  socketId: string;
  fid: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  ready: boolean;
  score: number;
  board: string[][];
}

export interface GameRoom {
  players: Map<string, Player>;
  board: string[][];
  timer: NodeJS.Timeout | null;
  timeRemaining: number;
}

export interface Player {
  id?: number;
  socketId: string;
  fid: number;
  address: `0x${string}`;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  ready?: boolean;
  staked?: boolean;
  score?: number;
  availableLetters?: { letter: string; value: number }[];
}
import type { GameStatus } from "@prisma/client";
import type { Player } from "../player";
import { ServerToClientSocketEvents } from "./socket.enum";

export interface PlayerJoinedEvent {
	player: Player;
	gameId: string;
}

export interface PlayerLeftEvent {
	player: Player;
	gameId: string;
}

export interface GameStartedEvent {
  gameId: string;
  board: string[][];
  timeRemaining: number;
  players: Array<Player>;
  startTime: number;
  endTime: number;
}

export interface GameUpdateEvent {
	gameId: string;
	players: Array<Player>;
	status: GameStatus;
}


export interface GameLoadingEvent {
  gameId: string;
	title: string;
	body: string;
}

export interface GameEndedEvent {
  gameId: string;
  players: Array<Player>;
}

export interface GameFullEvent {
	gameId: string;
	players: Array<Player>;
}


export interface RefreshedAvailableLettersEvent {
	gameId: string;
	players: Array<Player>;
	playerId: number;
}

export interface LetterPlacedEvent {
	gameId: string;
	player: Player;
	position: {
		x: number;
		y: number;
	};
	letter: string;
}

export interface LetterRemovedEvent {
	gameId: string;
	player: Player;
	position: {
		x: number;
		y: number;
	};
}

export interface WordSubmittedEvent {
	gameId: string;
	player: Player;
	words: string[];
	score: number;
	path: Array<{
		x: number;
		y: number;
	}>;
	board: string[][];
}

export interface WordNotValidEvent {
  gameId: string;
  player: Player;
  word: string;
  board: string[][];
  path: Array<{ x: number; y: number }>;
}

export interface ScoreUpdateEvent {
	gameId: string;
	player: Player;
	newScore: number;
	totalScore: number;
}

export interface TimerTickEvent {
	gameId: string;
	timeRemaining: number;
}


export interface AdjacentWordsNotValidEvent {
	gameId: string;
	player: Player;
	word: string;
	board: string[][];
	path: Array<{ x: number; y: number }>;
}

// Type map for all events
export type ServerToClientEvents = {
	[ServerToClientSocketEvents.PLAYER_JOINED]: PlayerJoinedEvent;
	[ServerToClientSocketEvents.PLAYER_LEFT]: PlayerLeftEvent;
	[ServerToClientSocketEvents.GAME_UPDATE]: GameUpdateEvent;
	[ServerToClientSocketEvents.GAME_STARTED]: GameStartedEvent;
	[ServerToClientSocketEvents.LETTER_PLACED]: LetterPlacedEvent;
	[ServerToClientSocketEvents.LETTER_REMOVED]: LetterRemovedEvent;
	[ServerToClientSocketEvents.WORD_SUBMITTED]: WordSubmittedEvent;
	[ServerToClientSocketEvents.SCORE_UPDATE]: ScoreUpdateEvent;
	[ServerToClientSocketEvents.TIMER_TICK]: TimerTickEvent;
	[ServerToClientSocketEvents.GAME_ENDED]: GameEndedEvent;
	[ServerToClientSocketEvents.REFRESHED_AVAILABLE_LETTERS]: RefreshedAvailableLettersEvent;
	[ServerToClientSocketEvents.WORD_NOT_VALID]: WordNotValidEvent;
	[ServerToClientSocketEvents.ADJACENT_WORDS_NOT_VALID]: AdjacentWordsNotValidEvent;
	[ServerToClientSocketEvents.GAME_LOADING]: GameLoadingEvent;
	[ServerToClientSocketEvents.GAME_FULL]: GameFullEvent;
};

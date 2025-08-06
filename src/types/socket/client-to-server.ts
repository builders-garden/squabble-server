import type { Player } from "../player";
import { ClientToServerSocketEvents } from "./socket.enum";

export interface ConnectToLobbyEvent {
	player: Player;
	gameId: string;
}

export interface PlayerReadyEvent {
	player: Player;
	gameId: string;
}

export interface PlayerStakeConfirmedEvent {
	player: Player;
	gameId: string;
	paymentHash: string;
	payerAddress: string;
}

export interface PlayerStakeRefundedEvent {
	player: Player;
	gameId: string;
	transactionHash: string;
}

export interface StartGameEvent {
	player: Player;
	gameId: string;
}

export interface SubmitWordEvent {
	player: Player;
	gameId: string;
	word: string;
	path: Array<{ x: number; y: number }>;
	isNew: boolean;
	placedLetters: Array<{ letter: string; x: number; y: number }>;
}

export interface PlaceLetterEvent {
	player: Player;
	gameId: string;
	letter: string;
	x: number;
	y: number;
}

export interface RemoveLetterEvent {
	player: Player;
	gameId: string;
	x: number;
	y: number;
}

export interface RefreshAvailableLettersEvent {
	gameId: string;
	playerId: number;
}

export type ClientToServerEvents = {
	[ClientToServerSocketEvents.CONNECT_TO_LOBBY]: ConnectToLobbyEvent;
	[ClientToServerSocketEvents.PLAYER_READY]: PlayerReadyEvent;
	[ClientToServerSocketEvents.PLAYER_STAKE_CONFIRMED]: PlayerStakeConfirmedEvent;
	[ClientToServerSocketEvents.PLAYER_STAKE_REFUNDED]: PlayerStakeRefundedEvent;
	[ClientToServerSocketEvents.START_GAME]: StartGameEvent;
	[ClientToServerSocketEvents.SUBMIT_WORD]: SubmitWordEvent;
	[ClientToServerSocketEvents.PLACE_LETTER]: PlaceLetterEvent;
	[ClientToServerSocketEvents.REMOVE_LETTER]: RemoveLetterEvent;
	[ClientToServerSocketEvents.REFRESH_AVAILABLE_LETTERS]: RefreshAvailableLettersEvent;
};

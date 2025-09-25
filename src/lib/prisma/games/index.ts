import { type Game, GameStatus } from "@prisma/client";
import { prisma } from "../client.js";

export interface GameWithParticipants extends Game {
	participants: {
		fid: number;
	}[];
}

// Get a game by ID
export async function getGameById(
	id: string,
): Promise<GameWithParticipants | null> {
	return prisma.game.findUnique({
		where: { id },
		include: {
			participants: {
				include: {
					user: true,
				},
			},
		},
	});
}

// Get all games with optional filters
export async function getGames(filters?: {
	status?: GameStatus;
	creatorFid?: number;
}): Promise<Game[]> {
	return prisma.game.findMany({
		where: filters,
		include: {
			participants: {
				include: {
					user: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

// Update a game
export async function updateGame(
	id: string,
	data: {
		status?: GameStatus;
		betAmount?: number;
		totalFunds?: number;
		conversationId?: string;
	},
): Promise<Game> {
	return prisma.game.update({
		where: { id },
		data,
	});
}

// Delete a game
export async function deleteGame(id: string): Promise<Game> {
	return prisma.game.delete({
		where: { id },
	});
}

// Get games by status
export async function getGamesByStatus(status: GameStatus): Promise<Game[]> {
	return prisma.game.findMany({
		where: { status },
		include: {
			participants: {
				include: {
					user: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

export async function setGameWinner(
	gameId: string,
	winnerFid: number,
): Promise<Game> {
	return prisma
		.$transaction([
			prisma.game.update({
				where: { id: gameId },
				data: { status: GameStatus.FINISHED },
			}),
			prisma.gameParticipant.update({
				where: {
					fid_gameId: {
						fid: winnerFid,
						gameId: gameId,
					},
				},
				data: { winner: true },
			}),
		])
		.then(([game]) => game);
}

export async function getStakedPlayersCount(gameId: string): Promise<number> {
	const game = await prisma.game.findUnique({
		where: { id: gameId },
		select: { betAmount: true },
	});

	if (!game || game.betAmount === 0) {
		return 0;
	}

	return prisma.gameParticipant.count({
		where: {
			gameId: gameId,
			paid: true,
		},
	});
}

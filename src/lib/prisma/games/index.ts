import { GameStatus } from "@prisma/client";
import { Game } from "@prisma/client";
import { prisma } from "../client.js";

// Get a game by ID
export async function getGameById(id: string): Promise<Game | null> {
  return prisma.game.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          user: true,
        },
      },
      creator: true,
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
      creator: true,
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
  }
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

// Get games by creator
export async function getGamesByCreator(creatorFid: number): Promise<Game[]> {
  return prisma.game.findMany({
    where: { creatorFid },
    include: {
      participants: {
        include: {
          user: true,
        },
      },
      creator: true,
    },
    orderBy: {
      createdAt: "desc",
    },
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
      creator: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

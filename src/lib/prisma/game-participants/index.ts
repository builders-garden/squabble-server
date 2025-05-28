import { GameParticipant } from "@prisma/client";
import { prisma } from "../client";

// Types
export type CreateGameParticipantInput = {
  fid: number;
  gameId: string;
  joined?: boolean;
  paid?: boolean;
  winner?: boolean;
  paymentHash?: string;
};

export type UpdateGameParticipantInput = {
  joined?: boolean;
  paid?: boolean;
  winner?: boolean;
  paymentHash?: string;
};

// Create a new game participant
export async function createGameParticipant(
  input: CreateGameParticipantInput
): Promise<GameParticipant> {
  try {
    return await prisma.gameParticipant.upsert({
      where: {
        fid_gameId: {
          fid: input.fid,
          gameId: input.gameId,
        },
      },
      update: {
        paymentHash: input.paymentHash,
        joined: input.joined,
        paid: input.paid,
        winner: input.winner,
      },
      create: {
        fid: input.fid,
        gameId: input.gameId,
        paymentHash: input.paymentHash,
        joined: input.joined,
        paid: input.paid,
        winner: input.winner,
      },
    });
  } catch (error) {
    throw new Error(`Failed to create/update game participant: ${error}`);
  }
}

// Get a game participant by FID and Game
export async function getGameParticipantByFidAndGameId(
  fid: number,
  gameId: string
): Promise<GameParticipant | null> {
  try {
    return await prisma.gameParticipant.findUnique({
      where: { fid_gameId: { fid, gameId } },
    });
  } catch (error) {
    throw new Error(`Failed to get game participant: ${error}`);
  }
}

// Get game participants by game ID
export async function getGameParticipantsByGameId(
  gameId: string
): Promise<GameParticipant[]> {
  try {
    return await prisma.gameParticipant.findMany({
      where: { gameId },
      include: {
        user: true,
      },
    });
  } catch (error) {
    throw new Error(`Failed to get game participants: ${error}`);
  }
}

// Get game participants by user FID
export async function getGameParticipantsByFid(
  fid: number
): Promise<GameParticipant[]> {
  try {
    return await prisma.gameParticipant.findMany({
      where: { fid },
      include: {
        game: true,
      },
    });
  } catch (error) {
    throw new Error(`Failed to get game participants: ${error}`);
  }
}

// Update a game participant
export async function updateGameParticipant(
  id: string,
  input: UpdateGameParticipantInput
): Promise<GameParticipant> {
  try {
    return await prisma.gameParticipant.update({
      where: { id },
      data: input,
    });
  } catch (error) {
    throw new Error(`Failed to update game participant: ${error}`);
  }
}

// Delete a game participant
export async function deleteGameParticipant(
  fid: number,
  gameId: string
): Promise<GameParticipant> {
  try {
    return await prisma.gameParticipant.delete({
      where: { fid_gameId: { fid, gameId } },
    });
  } catch (error) {
    throw new Error(`Failed to delete game participant: ${error}`);
  }
}

// Check if a user is already a participant in a game
export async function isUserParticipantInGame(
  fid: number,
  gameId: string
): Promise<boolean> {
  try {
    const participant = await prisma.gameParticipant.findUnique({
      where: {
        fid_gameId: {
          fid,
          gameId,
        },
      },
    });
    return !!participant;
  } catch (error) {
    throw new Error(`Failed to check game participant: ${error}`);
  }
}

// Get all winners for a game
export async function getGameWinners(
  gameId: string
): Promise<GameParticipant[]> {
  try {
    return await prisma.gameParticipant.findMany({
      where: {
        gameId,
        winner: true,
      },
      include: {
        user: true,
      },
    });
  } catch (error) {
    throw new Error(`Failed to get game winners: ${error}`);
  }
}

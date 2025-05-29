import { prisma } from "../client.js";

// Get a user by their FID
export const getUserByFid = async (fid: number) => {
  return await prisma.user.findUnique({
    where: { fid },
    include: {
      createdGames: true,
      participatedGames: true,
    },
  });
};

// Get a user by their username
export const getUserByUsername = async (username: string) => {
  return await prisma.user.findUnique({
    where: { username },
    include: {
      createdGames: true,
      participatedGames: true,
    },
  });
};

// Update a user
export const updateUser = async (
  fid: number,
  data: {
    displayName?: string;
    username?: string;
    avatarUrl?: string;
  }
) => {
  return await prisma.user.update({
    where: { fid },
    data,
  });
};

// Delete a user
export const deleteUser = async (fid: number) => {
  return await prisma.user.delete({
    where: { fid },
  });
};

// List all users
export const listUsers = async () => {
  return await prisma.user.findMany({
    include: {
      createdGames: true,
      participatedGames: true,
    },
  });
};

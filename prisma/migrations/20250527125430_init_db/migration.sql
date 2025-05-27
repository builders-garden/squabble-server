-- CreateTable
CREATE TABLE "User" (
    "fid" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "displayName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "betAmount" REAL NOT NULL,
    "totalFunds" REAL NOT NULL DEFAULT 0,
    "conversationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorFid" INTEGER NOT NULL,
    CONSTRAINT "Game_creatorFid_fkey" FOREIGN KEY ("creatorFid") REFERENCES "User" ("fid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fid" INTEGER NOT NULL,
    "joined" BOOLEAN NOT NULL DEFAULT false,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "winner" BOOLEAN NOT NULL DEFAULT false,
    "gameId" TEXT NOT NULL,
    "paymentHash" TEXT,
    CONSTRAINT "GameParticipant_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GameParticipant_fid_fkey" FOREIGN KEY ("fid") REFERENCES "User" ("fid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Game_status_idx" ON "Game"("status");

-- CreateIndex
CREATE INDEX "Game_creatorFid_idx" ON "Game"("creatorFid");

-- CreateIndex
CREATE INDEX "GameParticipant_fid_idx" ON "GameParticipant"("fid");

-- CreateIndex
CREATE INDEX "GameParticipant_gameId_idx" ON "GameParticipant"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameParticipant_fid_gameId_key" ON "GameParticipant"("fid", "gameId");

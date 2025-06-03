/*
  Warnings:

  - You are about to drop the column `creatorAddress` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `creatorFid` on the `Game` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractGameId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "betAmount" REAL NOT NULL,
    "totalFunds" REAL NOT NULL DEFAULT 0,
    "conversationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Game" ("betAmount", "conversationId", "createdAt", "id", "status", "totalFunds") SELECT "betAmount", "conversationId", "createdAt", "id", "status", "totalFunds" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE UNIQUE INDEX "Game_contractGameId_key" ON "Game"("contractGameId");
CREATE INDEX "Game_status_idx" ON "Game"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

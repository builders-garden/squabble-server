-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fid" INTEGER NOT NULL,
    "joined" BOOLEAN NOT NULL DEFAULT false,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "winner" BOOLEAN NOT NULL DEFAULT false,
    "gameId" TEXT NOT NULL,
    "paymentHash" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "GameParticipant_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GameParticipant_fid_fkey" FOREIGN KEY ("fid") REFERENCES "User" ("fid") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GameParticipant" ("fid", "gameId", "id", "joined", "paid", "paymentHash", "winner") SELECT "fid", "gameId", "id", "joined", "paid", "paymentHash", "winner" FROM "GameParticipant";
DROP TABLE "GameParticipant";
ALTER TABLE "new_GameParticipant" RENAME TO "GameParticipant";
CREATE INDEX "GameParticipant_fid_idx" ON "GameParticipant"("fid");
CREATE INDEX "GameParticipant_gameId_idx" ON "GameParticipant"("gameId");
CREATE UNIQUE INDEX "GameParticipant_fid_gameId_key" ON "GameParticipant"("fid", "gameId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

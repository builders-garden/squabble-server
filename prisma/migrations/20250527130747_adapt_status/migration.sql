-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "betAmount" REAL NOT NULL,
    "totalFunds" REAL NOT NULL DEFAULT 0,
    "conversationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorFid" INTEGER NOT NULL,
    CONSTRAINT "Game_creatorFid_fkey" FOREIGN KEY ("creatorFid") REFERENCES "User" ("fid") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Game" ("betAmount", "conversationId", "createdAt", "creatorFid", "id", "status", "totalFunds") SELECT "betAmount", "conversationId", "createdAt", "creatorFid", "id", "status", "totalFunds" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE INDEX "Game_status_idx" ON "Game"("status");
CREATE INDEX "Game_creatorFid_idx" ON "Game"("creatorFid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

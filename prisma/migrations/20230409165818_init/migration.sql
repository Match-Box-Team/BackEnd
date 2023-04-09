/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `UserGame` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[game_id]` on the table `UserGame` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "GameHistory" (
    "game_history_id" UUID NOT NULL,
    "winner_id" UUID NOT NULL,
    "loser_id" UUID NOT NULL,

    CONSTRAINT "GameHistory_pkey" PRIMARY KEY ("game_history_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGame_user_id_key" ON "UserGame"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserGame_game_id_key" ON "UserGame"("game_id");

-- AddForeignKey
ALTER TABLE "GameHistory" ADD CONSTRAINT "GameHistory_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "UserGame"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameHistory" ADD CONSTRAINT "GameHistory_loser_id_fkey" FOREIGN KEY ("loser_id") REFERENCES "UserGame"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

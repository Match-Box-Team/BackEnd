/*
  Warnings:

  - You are about to drop the column `game_id` on the `GameWatch` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `GameWatch` table. All the data in the column will be lost.
  - Added the required column `user_game_id1` to the `GameWatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_game_id2` to the `GameWatch` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "GameWatch" DROP CONSTRAINT "GameWatch_game_id_fkey";

-- DropForeignKey
ALTER TABLE "GameWatch" DROP CONSTRAINT "GameWatch_user_id_fkey";

-- AlterTable
ALTER TABLE "GameWatch" DROP COLUMN "game_id",
DROP COLUMN "user_id",
ADD COLUMN     "user_game_id1" UUID NOT NULL,
ADD COLUMN     "user_game_id2" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "GameWatch" ADD CONSTRAINT "GameWatch_user_game_id1_fkey" FOREIGN KEY ("user_game_id1") REFERENCES "UserGame"("user_game_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameWatch" ADD CONSTRAINT "GameWatch_user_game_id2_fkey" FOREIGN KEY ("user_game_id2") REFERENCES "UserGame"("user_game_id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - The primary key for the `Channel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Chat` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `user_it` on the `Chat` table. All the data in the column will be lost.
  - The primary key for the `Friend` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Game` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `GameHistory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `GameWatch` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserChannel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserGame` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `channel_id` on the `Channel` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `user_id` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `chat_id` on the `Chat` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `friend_id` on the `Friend` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `game_id` on the `Game` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `game_history_id` on the `GameHistory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `game_watch_id` on the `GameWatch` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_channel_id` on the `UserChannel` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_game_id` on the `UserGame` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Channel" DROP CONSTRAINT "Channel_pkey",
DROP COLUMN "channel_id",
ADD COLUMN     "channel_id" UUID NOT NULL,
ADD CONSTRAINT "Channel_pkey" PRIMARY KEY ("channel_id");

-- AlterTable
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_pkey",
DROP COLUMN "user_it",
ADD COLUMN     "user_id" INTEGER NOT NULL,
DROP COLUMN "chat_id",
ADD COLUMN     "chat_id" UUID NOT NULL,
ADD CONSTRAINT "Chat_pkey" PRIMARY KEY ("chat_id");

-- AlterTable
ALTER TABLE "Friend" DROP CONSTRAINT "Friend_pkey",
DROP COLUMN "friend_id",
ADD COLUMN     "friend_id" UUID NOT NULL,
ADD CONSTRAINT "Friend_pkey" PRIMARY KEY ("friend_id");

-- AlterTable
ALTER TABLE "Game" DROP CONSTRAINT "Game_pkey",
DROP COLUMN "game_id",
ADD COLUMN     "game_id" UUID NOT NULL,
ADD CONSTRAINT "Game_pkey" PRIMARY KEY ("game_id");

-- AlterTable
ALTER TABLE "GameHistory" DROP CONSTRAINT "GameHistory_pkey",
DROP COLUMN "game_history_id",
ADD COLUMN     "game_history_id" UUID NOT NULL,
ADD CONSTRAINT "GameHistory_pkey" PRIMARY KEY ("game_history_id");

-- AlterTable
ALTER TABLE "GameWatch" DROP CONSTRAINT "GameWatch_pkey",
DROP COLUMN "game_watch_id",
ADD COLUMN     "game_watch_id" UUID NOT NULL,
ADD CONSTRAINT "GameWatch_pkey" PRIMARY KEY ("game_watch_id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("user_id");

-- AlterTable
ALTER TABLE "UserChannel" DROP CONSTRAINT "UserChannel_pkey",
DROP COLUMN "user_channel_id",
ADD COLUMN     "user_channel_id" UUID NOT NULL,
ADD CONSTRAINT "UserChannel_pkey" PRIMARY KEY ("user_channel_id");

-- AlterTable
ALTER TABLE "UserGame" DROP CONSTRAINT "UserGame_pkey",
DROP COLUMN "user_game_id",
ADD COLUMN     "user_game_id" UUID NOT NULL,
ADD CONSTRAINT "UserGame_pkey" PRIMARY KEY ("user_game_id");

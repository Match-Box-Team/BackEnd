-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "nickname" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "image" TEXT,
    "intra_id" TEXT NOT NULL,
    "phone_number" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "GameWatch" (
    "game_watch_id" SERIAL NOT NULL,
    "current_viewr" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "GameWatch_pkey" PRIMARY KEY ("game_watch_id")
);

-- CreateTable
CREATE TABLE "Game" (
    "game_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "is_playable" BOOLEAN NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("game_id")
);

-- CreateTable
CREATE TABLE "UserGame" (
    "user_game_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,

    CONSTRAINT "UserGame_pkey" PRIMARY KEY ("user_game_id")
);

-- CreateTable
CREATE TABLE "GameHistory" (
    "game_history_id" SERIAL NOT NULL,
    "winner_id" INTEGER NOT NULL,
    "loser_id" INTEGER NOT NULL,

    CONSTRAINT "GameHistory_pkey" PRIMARY KEY ("game_history_id")
);

-- CreateTable
CREATE TABLE "Friend" (
    "friend_id" SERIAL NOT NULL,
    "is_ban" BOOLEAN NOT NULL,
    "my_id" INTEGER NOT NULL,
    "buddy_id" INTEGER NOT NULL,

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("friend_id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "channel_id" SERIAL NOT NULL,
    "channel_name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "is_public" BOOLEAN NOT NULL,
    "is_dm" BOOLEAN NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("channel_id")
);

-- CreateTable
CREATE TABLE "UserChannel" (
    "user_channel_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "channel_id" INTEGER NOT NULL,
    "is_owner" BOOLEAN NOT NULL,
    "is_admin" BOOLEAN NOT NULL,
    "is_mute" BOOLEAN NOT NULL,
    "last_chat_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserChannel_pkey" PRIMARY KEY ("user_channel_id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "chat_id" SERIAL NOT NULL,
    "user_it" INTEGER NOT NULL,
    "channer_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("chat_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_intra_id_key" ON "User"("intra_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_number_key" ON "User"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "GameHistory_winner_id_key" ON "GameHistory"("winner_id");

-- CreateIndex
CREATE UNIQUE INDEX "GameHistory_loser_id_key" ON "GameHistory"("loser_id");

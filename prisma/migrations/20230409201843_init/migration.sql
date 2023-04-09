-- CreateTable
CREATE TABLE "User" (
    "user_id" UUID NOT NULL,
    "nickname" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "intra_id" TEXT NOT NULL,
    "phone_number" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Game" (
    "game_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "is_playable" BOOLEAN NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("game_id")
);

-- CreateTable
CREATE TABLE "UserGame" (
    "user_game_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "game_id" UUID NOT NULL,

    CONSTRAINT "UserGame_pkey" PRIMARY KEY ("user_game_id")
);

-- CreateTable
CREATE TABLE "GameWatch" (
    "game_watch_id" UUID NOT NULL,
    "current_viewer" INTEGER NOT NULL,
    "game_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "GameWatch_pkey" PRIMARY KEY ("game_watch_id")
);

-- CreateTable
CREATE TABLE "GameHistory" (
    "game_history_id" UUID NOT NULL,
    "winner_id" UUID NOT NULL,
    "loser_id" UUID NOT NULL,

    CONSTRAINT "GameHistory_pkey" PRIMARY KEY ("game_history_id")
);

-- CreateTable
CREATE TABLE "Friend" (
    "friend_id" UUID NOT NULL,
    "is_ban" BOOLEAN NOT NULL,
    "my_id" UUID NOT NULL,
    "buddy_id" UUID NOT NULL,

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("friend_id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "channel_id" UUID NOT NULL,
    "channel_name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "is_public" BOOLEAN NOT NULL,
    "is_dm" BOOLEAN NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("channel_id")
);

-- CreateTable
CREATE TABLE "UserChannel" (
    "user_channel_id" UUID NOT NULL,
    "is_owner" BOOLEAN NOT NULL,
    "is_admin" BOOLEAN NOT NULL,
    "is_mute" BOOLEAN NOT NULL,
    "last_chat_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,

    CONSTRAINT "UserChannel_pkey" PRIMARY KEY ("user_channel_id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "chat_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_channel_id" UUID NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("chat_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_intra_id_key" ON "User"("intra_id");

-- AddForeignKey
ALTER TABLE "UserGame" ADD CONSTRAINT "UserGame_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGame" ADD CONSTRAINT "UserGame_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameWatch" ADD CONSTRAINT "GameWatch_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameWatch" ADD CONSTRAINT "GameWatch_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_my_id_fkey" FOREIGN KEY ("my_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_buddy_id_fkey" FOREIGN KEY ("buddy_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChannel" ADD CONSTRAINT "UserChannel_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChannel" ADD CONSTRAINT "UserChannel_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "Channel"("channel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_user_channel_id_fkey" FOREIGN KEY ("user_channel_id") REFERENCES "UserChannel"("user_channel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

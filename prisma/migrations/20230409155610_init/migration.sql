-- CreateTable
CREATE TABLE "GameWatch" (
    "game_watch_id" UUID NOT NULL,
    "current_viewer" INTEGER NOT NULL,
    "game_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "GameWatch_pkey" PRIMARY KEY ("game_watch_id")
);

-- AddForeignKey
ALTER TABLE "GameWatch" ADD CONSTRAINT "GameWatch_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameWatch" ADD CONSTRAINT "GameWatch_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

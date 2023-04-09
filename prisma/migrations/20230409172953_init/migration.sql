-- CreateTable
CREATE TABLE "Chat" (
    "chat_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_channel_id" UUID NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("chat_id")
);

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_user_channel_id_fkey" FOREIGN KEY ("user_channel_id") REFERENCES "UserChannel"("user_channel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

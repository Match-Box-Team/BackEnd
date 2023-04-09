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

-- AddForeignKey
ALTER TABLE "UserChannel" ADD CONSTRAINT "UserChannel_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChannel" ADD CONSTRAINT "UserChannel_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "Channel"("channel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

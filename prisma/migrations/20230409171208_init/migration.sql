-- CreateTable
CREATE TABLE "Friend" (
    "friend_id" UUID NOT NULL,
    "is_ban" BOOLEAN NOT NULL,
    "my_id" UUID NOT NULL,
    "buddy_id" UUID NOT NULL,

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("friend_id")
);

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_my_id_fkey" FOREIGN KEY ("my_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_buddy_id_fkey" FOREIGN KEY ("buddy_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

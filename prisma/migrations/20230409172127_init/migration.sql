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

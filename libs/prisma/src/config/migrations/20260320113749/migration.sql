/*
  Warnings:

  - Added the required column `user_id` to the `api_endpoint` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WebhookType" AS ENUM ('SLACK', 'GENERIC');

-- AlterTable
ALTER TABLE "api_endpoint" ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "webhook_channel" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "type" "WebhookType" NOT NULL,
    "url" VARCHAR(1000) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3),
    "updated_by" INTEGER,
    "is_deleted" BOOLEAN DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" INTEGER,

    CONSTRAINT "webhook_channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_log" (
    "id" SERIAL NOT NULL,
    "channel_id" INTEGER NOT NULL,
    "endpoint_id" INTEGER,
    "alert_type" VARCHAR(10) NOT NULL,
    "status_code" INTEGER,
    "is_success" BOOLEAN NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_channel_user_id_is_deleted_idx" ON "webhook_channel"("user_id", "is_deleted");

-- CreateIndex
CREATE INDEX "webhook_log_channel_id_created_at_idx" ON "webhook_log"("channel_id", "created_at");

-- CreateIndex
CREATE INDEX "api_endpoint_user_id_idx" ON "api_endpoint"("user_id");

-- AddForeignKey
ALTER TABLE "api_endpoint" ADD CONSTRAINT "api_endpoint_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "base"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_channel" ADD CONSTRAINT "webhook_channel_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "base"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_log" ADD CONSTRAINT "webhook_log_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "webhook_channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

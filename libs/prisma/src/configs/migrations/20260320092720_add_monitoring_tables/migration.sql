/*
  Warnings:

  - The values [FCM] on the enum `TokenType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `token_fcm` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EndpointStatus" AS ENUM ('UP', 'DOWN', 'SLOW', 'PAUSED');

-- CreateEnum
CREATE TYPE "HttpMethod" AS ENUM ('GET', 'POST', 'HEAD');

-- CreateEnum
CREATE TYPE "CheckInterval" AS ENUM ('SEC_30', 'MIN_1', 'MIN_3', 'MIN_5');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MONITORING';

-- AlterEnum
BEGIN;
CREATE TYPE "TokenType_new" AS ENUM ('JWT');
ALTER TABLE "base"."token" ALTER COLUMN "token_type" TYPE "TokenType_new" USING ("token_type"::text::"TokenType_new");
ALTER TYPE "TokenType" RENAME TO "TokenType_old";
ALTER TYPE "TokenType_new" RENAME TO "TokenType";
DROP TYPE "public"."TokenType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "base"."token_fcm" DROP CONSTRAINT "token_fcm_token_id_fkey";

-- DropTable
DROP TABLE "base"."token_fcm";

-- DropEnum
DROP TYPE "Platform";

-- CreateTable
CREATE TABLE "api_endpoint" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "method" "HttpMethod" NOT NULL DEFAULT 'GET',
    "headers" JSONB,
    "body" JSONB,
    "expected_status" INTEGER NOT NULL DEFAULT 200,
    "timeout" INTEGER NOT NULL DEFAULT 10000,
    "interval" "CheckInterval" NOT NULL DEFAULT 'MIN_1',
    "status" "EndpointStatus" NOT NULL DEFAULT 'UP',
    "failure_threshold" INTEGER NOT NULL DEFAULT 3,
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "last_checked_at" TIMESTAMP(3),
    "is_paused" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "updated_at" TIMESTAMP(3),
    "updated_by" INTEGER,
    "is_deleted" BOOLEAN DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" INTEGER,

    CONSTRAINT "api_endpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_log" (
    "id" SERIAL NOT NULL,
    "endpoint_id" INTEGER NOT NULL,
    "status_code" INTEGER,
    "response_time" INTEGER,
    "is_success" BOOLEAN NOT NULL,
    "error_message" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitoring_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monitoring_log_endpoint_id_created_at_idx" ON "monitoring_log"("endpoint_id", "created_at");

-- AddForeignKey
ALTER TABLE "monitoring_log" ADD CONSTRAINT "monitoring_log_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "api_endpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

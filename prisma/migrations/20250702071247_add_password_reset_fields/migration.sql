/*
  Warnings:

  - You are about to drop the column `passwordChangedAt` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `resetPasswordExpires` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `resetPasswordToken` on the `projects` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[resetPasswordToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "projects_resetPasswordToken_key";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "passwordChangedAt",
DROP COLUMN "resetPasswordExpires",
DROP COLUMN "resetPasswordToken";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_resetPasswordToken_key" ON "users"("resetPasswordToken");

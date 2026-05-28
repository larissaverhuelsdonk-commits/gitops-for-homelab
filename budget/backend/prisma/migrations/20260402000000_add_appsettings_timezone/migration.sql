-- AppSettings.timeZone (IANA); aligns DB with Prisma schema for signup nested create.

ALTER TABLE "AppSettings" ADD COLUMN IF NOT EXISTS "timeZone" TEXT NOT NULL DEFAULT 'UTC';

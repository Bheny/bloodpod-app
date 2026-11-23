-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "path" TEXT NOT NULL,
    "entry" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "campaign" TEXT,
    "device" TEXT NOT NULL,
    "installed" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT,
    "city" TEXT,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageView_at_idx" ON "PageView"("at");

-- CreateIndex
CREATE INDEX "PageView_visitorId_at_idx" ON "PageView"("visitorId", "at");

-- CreateIndex
CREATE INDEX "PageView_userId_at_idx" ON "PageView"("userId", "at");

-- CreateIndex
CREATE INDEX "PageView_path_at_idx" ON "PageView"("path", "at");

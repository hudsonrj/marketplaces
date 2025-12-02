-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost_price" DECIMAL NOT NULL,
    "weight" REAL,
    "dimensions" TEXT,
    "origin_cep" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SearchJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "SearchJob_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SearchResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "job_id" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "shipping" DECIMAL,
    "link" TEXT NOT NULL,
    "seller_name" TEXT,
    "seller_location" TEXT,
    "seller_rating" TEXT,
    "image_url" TEXT,
    "collected_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SearchResult_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "SearchJob" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

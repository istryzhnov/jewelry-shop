import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_import_runs_status" AS ENUM('preview', 'running', 'done');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'importRows', 'syncPhotos');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'importRows', 'syncPhotos');
  CREATE TABLE "import_runs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_import_runs_status" DEFAULT 'preview',
  	"processed" numeric DEFAULT 0,
  	"report" jsonb,
  	"results" jsonb,
  	"rows" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  DROP INDEX "media_sizes_large_sizes_large_filename_idx";
  ALTER TABLE "products_variants" ADD COLUMN "cost_price" numeric;
  ALTER TABLE "products" ADD COLUMN "photo_folder" varchar;
  ALTER TABLE "products" ADD COLUMN "photo_sync_error" varchar;
  ALTER TABLE "products" ADD COLUMN "import_managed" boolean DEFAULT false;
  ALTER TABLE "products" ADD COLUMN "auto_publish" boolean DEFAULT false;
  ALTER TABLE "products" ADD COLUMN "archived_by_import" boolean DEFAULT false;
  ALTER TABLE "categories" ADD COLUMN "import_name" varchar;
  ALTER TABLE "product_collections" ADD COLUMN "import_name" varchar;
  ALTER TABLE "media" ADD COLUMN "source_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "import_runs_id" integer;
  ALTER TABLE "settings" ADD COLUMN "markup_percent" numeric DEFAULT 0;
  ALTER TABLE "settings" ADD COLUMN "round_to" numeric DEFAULT 10;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "import_runs_updated_at_idx" ON "import_runs" USING btree ("updated_at");
  CREATE INDEX "import_runs_created_at_idx" ON "import_runs" USING btree ("created_at");
  CREATE UNIQUE INDEX "import_runs_filename_idx" ON "import_runs" USING btree ("filename");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_import_runs_fk" FOREIGN KEY ("import_runs_id") REFERENCES "public"."import_runs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "categories_import_name_idx" ON "categories" USING btree ("import_name");
  CREATE INDEX "product_collections_import_name_idx" ON "product_collections" USING btree ("import_name");
  CREATE INDEX "media_source_id_idx" ON "media" USING btree ("source_id");
  CREATE INDEX "payload_locked_documents_rels_import_runs_id_idx" ON "payload_locked_documents_rels" USING btree ("import_runs_id");
  ALTER TABLE "media" DROP COLUMN "sizes_large_url";
  ALTER TABLE "media" DROP COLUMN "sizes_large_width";
  ALTER TABLE "media" DROP COLUMN "sizes_large_height";
  ALTER TABLE "media" DROP COLUMN "sizes_large_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_large_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_large_filename";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "import_runs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "import_runs" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_import_runs_fk";
  
  DROP INDEX "categories_import_name_idx";
  DROP INDEX "product_collections_import_name_idx";
  DROP INDEX "media_source_id_idx";
  DROP INDEX "payload_locked_documents_rels_import_runs_id_idx";
  ALTER TABLE "media" ADD COLUMN "sizes_large_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_large_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_large_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_large_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_large_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_large_filename" varchar;
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  ALTER TABLE "products_variants" DROP COLUMN "cost_price";
  ALTER TABLE "products" DROP COLUMN "photo_folder";
  ALTER TABLE "products" DROP COLUMN "photo_sync_error";
  ALTER TABLE "products" DROP COLUMN "import_managed";
  ALTER TABLE "products" DROP COLUMN "auto_publish";
  ALTER TABLE "products" DROP COLUMN "archived_by_import";
  ALTER TABLE "categories" DROP COLUMN "import_name";
  ALTER TABLE "product_collections" DROP COLUMN "import_name";
  ALTER TABLE "media" DROP COLUMN "source_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "import_runs_id";
  ALTER TABLE "settings" DROP COLUMN "markup_percent";
  ALTER TABLE "settings" DROP COLUMN "round_to";
  DROP TYPE "public"."enum_import_runs_status";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}

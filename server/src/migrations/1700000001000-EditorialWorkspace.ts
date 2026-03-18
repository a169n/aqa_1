import { MigrationInterface, QueryRunner } from 'typeorm';

export class EditorialWorkspace1700000001000 implements MigrationInterface {
  name = 'EditorialWorkspace1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."posts_status_enum" AS ENUM ('draft', 'published', 'archived')
    `);
    await queryRunner.query(`
      ALTER TABLE "posts"
      ADD COLUMN "status" "public"."posts_status_enum" NOT NULL DEFAULT 'published',
      ADD COLUMN "excerpt" character varying,
      ADD COLUMN "category_id" integer,
      ADD COLUMN "published_at" TIMESTAMPTZ,
      ADD COLUMN "archived_at" TIMESTAMPTZ
    `);

    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_categories_name" UNIQUE ("name"),
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tags" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tags_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tags_name" UNIQUE ("name"),
        CONSTRAINT "UQ_tags_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "post_tags" (
        "id" SERIAL NOT NULL,
        "post_id" integer NOT NULL,
        "tag_id" integer NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_post_tags_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_post_tags_post_tag" UNIQUE ("post_id", "tag_id"),
        CONSTRAINT "FK_post_tags_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_post_tags_tag" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_post_tags_post_id" ON "post_tags" ("post_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_post_tags_tag_id" ON "post_tags" ("tag_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "bookmarks" (
        "id" SERIAL NOT NULL,
        "post_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bookmarks_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_bookmarks_post_user" UNIQUE ("post_id", "user_id"),
        CONSTRAINT "FK_bookmarks_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_bookmarks_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_bookmarks_post_id" ON "bookmarks" ("post_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_bookmarks_user_id" ON "bookmarks" ("user_id")
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."reports_status_enum" AS ENUM ('open', 'resolved', 'dismissed')
    `);
    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id" SERIAL NOT NULL,
        "reporter_id" integer NOT NULL,
        "post_id" integer,
        "comment_id" integer,
        "reason" text NOT NULL,
        "status" "public"."reports_status_enum" NOT NULL DEFAULT 'open',
        "resolution_note" text,
        "resolved_by_id" integer,
        "resolved_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reports_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_reports_target" CHECK (
          ("post_id" IS NOT NULL AND "comment_id" IS NULL)
          OR ("post_id" IS NULL AND "comment_id" IS NOT NULL)
        ),
        CONSTRAINT "FK_reports_reporter" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_reports_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_reports_comment" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_reports_resolved_by" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_reports_reporter_id" ON "reports" ("reporter_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_reports_post_id" ON "reports" ("post_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_reports_comment_id" ON "reports" ("comment_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_reports_status" ON "reports" ("status")
    `);

    await queryRunner.query(`
      ALTER TABLE "posts"
      ADD CONSTRAINT "FK_posts_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_posts_status" ON "posts" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_posts_category_id" ON "posts" ("category_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_posts_published_at" ON "posts" ("published_at")
    `);

    await queryRunner.query(`
      UPDATE "posts"
      SET "status" = 'published',
          "published_at" = COALESCE("published_at", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_posts_published_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_posts_category_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_posts_status"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_category"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_reports_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_reports_comment_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_reports_post_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_reports_reporter_id"`);
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP TYPE "public"."reports_status_enum"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_bookmarks_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bookmarks_post_id"`);
    await queryRunner.query(`DROP TABLE "bookmarks"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_post_tags_tag_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_post_tags_post_id"`);
    await queryRunner.query(`DROP TABLE "post_tags"`);

    await queryRunner.query(`DROP TABLE "tags"`);
    await queryRunner.query(`DROP TABLE "categories"`);

    await queryRunner.query(`
      ALTER TABLE "posts"
      DROP COLUMN "archived_at",
      DROP COLUMN "published_at",
      DROP COLUMN "category_id",
      DROP COLUMN "excerpt",
      DROP COLUMN "status"
    `);
    await queryRunner.query(`DROP TYPE "public"."posts_status_enum"`);
  }
}

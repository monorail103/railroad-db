import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { Princess_Sofia } from "next/font/google";

export const projectStatus = pgEnum("project_status", [
  "IN_PROGRESS",
  "COMPLETED",
  "ARCHIVED",
]);

export const itemType = pgEnum("item_type", ["SET", "SINGLE_CAR", "PART"]);

// 1. プロジェクト（編成マスター）テーブル
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // Clerkから渡されるユーザーID
  name: text("name").notNull(),
  status: projectStatus("status").notNull().default("IN_PROGRESS"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("projects_status_idx").on(table.status),
  index("projects_user_id_idx").on(table.userId), // ユーザー検索を爆速にするインデックス
]);

// 2. 所有品テーブル
export const items = pgTable("items", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "restrict", onUpdate: "cascade" }),
  type: itemType("type").notNull(),
  price: text("price"), // 価格
  maker: text("maker"), // "KATO", "TOMIX" など
  name: text("name").notNull(), // 任意の名前
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("items_project_id_idx").on(table.projectId),
]);

// 3. wantedテーブル
export const wanted = pgTable("wanted", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: text("name").notNull(),
  remarks: text("remarks"), // DBの枠で表現できないメモ
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("wanted_project_id_idx").on(table.projectId),
]);
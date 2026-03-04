import { index, integer, pgEnum, pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { ITEM_SCALES } from "@/lib/item-scale";

export const projectStatus = pgEnum("project_status", [
  "IN_PROGRESS",
  "COMPLETED",
  "ARCHIVED",
]);

export const itemScale = pgEnum("item_scale", ITEM_SCALES);

// フレンド申請のステータス
export const friendshipStatus = pgEnum("friendship_status", [
  "PENDING",  // 申請中
  "ACCEPTED", // 承認済み（フレンド）
  "REJECTED", // 拒否
]);

// アイテムの種類
export const itemType = pgEnum("item_type", ["SET", "SINGLE_CAR", "PART", "MATERIAL", "TOOL"]);

// 欲しいものの優先度
export const wantedPriority = pgEnum("wanted_priority", ["HIGH", "MEDIUM", "LOW"]);

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
  index("projects_user_id_idx").on(table.userId),
]);

// 2. 所有品テーブル
export const items = pgTable("items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), 
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "set null", onUpdate: "cascade" }), // プロジェクト削除時は「未分類（null）」として残し、トレード用にキープできるようにする
  type: itemType("type").notNull(),
  price: text("price"), 
  maker: text("maker"), 
  name: text("name").notNull(), 
  remarks: text("remarks"), 
  scale: itemScale("scale").notNull().default("N"),
  amount: integer("amount").notNull().default(1), 
  photoUrl: text("photo_url"),
  isTradeable: boolean("is_tradeable").notNull().default(false), // トレード可能かどうかのフラグ
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("items_project_id_idx").on(table.projectId),
  index("items_user_id_idx").on(table.userId), // ユーザーごとの全アイテム検索用
  index("items_tradeable_idx").on(table.isTradeable), // トレード公開アイテムの検索用
]);

// 3. wantedテーブル
export const wanted = pgTable("wanted", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade", onUpdate: "cascade" }),   // プロジェクトに紐づかない単独の欲しいものも許容
  maker: text("maker"), 
  name: text("name").notNull(),
  scale: itemScale("scale").notNull().default("N"), 
  remarks: text("remarks"), 
  amount: integer("amount").notNull().default(1), 
  priority: wantedPriority("priority").notNull().default("MEDIUM"), // 優先度を追加（デフォルトは中）
  photoUrl: text("photo_url"),
  storeUrl: text("store_url"), 
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("wanted_project_id_idx").on(table.projectId),
  index("wanted_user_id_idx").on(table.userId),
]);

// 4. プロフィールテーブル
export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey(), 
  displayName: text("display_name").notNull(), 
  friendCode: text("friend_code").notNull().unique(), 
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 5. フレンド（つながり）テーブル
export const friendships = pgTable("friendships", {
  id: uuid("id").defaultRandom().primaryKey(),
  requesterId: text("requester_id")
    .notNull()
    .references(() => profiles.userId, { onDelete: "cascade" }), 
  addresseeId: text("addressee_id")
    .notNull()
    .references(() => profiles.userId, { onDelete: "cascade" }), 
  status: friendshipStatus("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("friendships_requester_idx").on(table.requesterId),
  index("friendships_addressee_idx").on(table.addresseeId),
]);
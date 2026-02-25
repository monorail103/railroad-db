import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const projectStatus = pgEnum("project_status", [
  "IN_PROGRESS",
  "COMPLETED",
  "ARCHIVED",
]);

export const itemScale = pgEnum("item_scale", [
  "N", 
  "HO", 
  "PLARAIL", 
  "DECAL",   // インレタ・シール類
  "PART_N",  // Nパーツ
  "PART_HO", // HOパーツ
  "OTHER"    // その他
]);

// フレンド申請のステータス
export const friendshipStatus = pgEnum("friendship_status", [
  "PENDING",  // 申請中
  "ACCEPTED", // 承認済み（フレンド）
  "REJECTED", // 拒否
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
  scale: itemScale("scale").notNull().default("N"),
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
  scale: itemScale("scale").notNull().default("N"), // Nゲージ、HOゲージなど
  remarks: text("remarks"), // DBの枠で表現できないメモ
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("wanted_project_id_idx").on(table.projectId),
]);

// 4. プロフィールテーブル（ユーザー名とフレンド追加用コードを管理）
export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey(), // ClerkのuserIdをそのまま主キーにする
  displayName: text("display_name").notNull(), // 画面に表示する名前
  friendCode: text("friend_code").notNull().unique(), // 友達追加に使う短い英数字
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 5. フレンド（つながり）テーブル
export const friendships = pgTable("friendships", {
  id: uuid("id").defaultRandom().primaryKey(),
  requesterId: text("requester_id")
    .notNull()
    .references(() => profiles.userId, { onDelete: "cascade" }), // 申請した人
  addresseeId: text("addressee_id")
    .notNull()
    .references(() => profiles.userId, { onDelete: "cascade" }), // 申請された人
  status: friendshipStatus("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("friendships_requester_idx").on(table.requesterId),
  index("friendships_addressee_idx").on(table.addresseeId),
]);
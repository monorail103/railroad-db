"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { items, projects } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Scale } from "@/lib/item-scale";

type ItemType = "SET" | "SINGLE_CAR" | "PART";

/** パーツ・インレタ/シール系は個別で要らないリスト行き不可 */
const UNWANTED_BLOCKED_TYPES: string[] = ["PART"];
const UNWANTED_BLOCKED_SCALES: string[] = ["DECAL", "PART_N", "PART_HO"];

export async function updateItemById(itemId: string, formData: FormData) {
    const { userId } = await auth();
    if (!userId) return;

    const nextProjectId = (formData.get("projectId") as string) || null;
    const type = formData.get("type") as ItemType;
    const maker = (formData.get("maker") as string) ?? "";
    const name = (formData.get("name") as string) ?? "";
    const scale = formData.get("scale") as Scale;
    const amount = Number(formData.get("amount"));
    const price = (formData.get("price") as string) ?? "";
    const remarks = (formData.get("remarks") as string) ?? "";
    const photoUrl = (formData.get("photoUrl") as string) ?? "";

    if (!name.trim() || !type || !scale || !Number.isInteger(amount) || amount < 1) {
        return;
    }

    // 移動先プロジェクトが指定されている場合は本人のものか確認
    if (nextProjectId) {
        const [ownerProject] = await db
            .select({ id: projects.id })
            .from(projects)
            .where(and(eq(projects.id, nextProjectId), eq(projects.userId, userId)));
        if (!ownerProject) return;
    }

    // 対象アイテムが本人のものか確認（プロジェクト所属 or 要らないリスト）
    const [targetItem] = await db
        .select({ id: items.id, currentProjectId: items.projectId, isTradeable: items.isTradeable })
        .from(items)
        .where(and(eq(items.id, itemId), eq(items.userId, userId)));
    if (!targetItem) return;

    // 要らないリストのアイテムはプロジェクト未指定でも編集OK、tradeable状態は維持
    const willBeTradeable = nextProjectId ? false : targetItem.isTradeable;

    await db
        .update(items)
        .set({
            projectId: nextProjectId,
            type,
            maker: maker.trim() || null,
            name: name.trim(),
            scale,
            amount,
            price: price.trim() || null,
            remarks: remarks.trim() || null,
            photoUrl: photoUrl.trim() || null,
            isTradeable: willBeTradeable,
        })
        .where(eq(items.id, itemId));

    revalidatePath(`/item/${itemId}`);
    if (targetItem.currentProjectId) {
        revalidatePath(`/projects/${targetItem.currentProjectId}`);
    }
    if (nextProjectId) {
        revalidatePath(`/projects/${nextProjectId}`);
    }
    revalidatePath("/unwanted");
    redirect(`/item/${itemId}?updated=1`);
}

/** アイテムを要らないリスト行きにする（projectId=null, isTradeable=true） */
export async function moveItemToUnwanted(itemId: string, formData: FormData) {
    const { userId } = await auth();
    if (!userId) return;

    const [target] = await db
        .select({ id: items.id, type: items.type, scale: items.scale, projectId: items.projectId })
        .from(items)
        .where(and(eq(items.id, itemId), eq(items.userId, userId)));
    if (!target) return;

    // パーツ・インレタ/シール系は個別で不可
    if (UNWANTED_BLOCKED_TYPES.includes(target.type) || UNWANTED_BLOCKED_SCALES.includes(target.scale)) return;

    const prevProjectId = target.projectId;
    const remarks = (formData.get("remarks") as string) ?? "";
    const price = (formData.get("price") as string) ?? "";

    await db
        .update(items)
        .set({
            projectId: null,
            isTradeable: true,
            remarks: remarks.trim() || null,
            price: price.trim() || null,
        })
        .where(eq(items.id, itemId));

    revalidatePath(`/item/${itemId}`);
    if (prevProjectId) revalidatePath(`/projects/${prevProjectId}`);
    revalidatePath("/unwanted");
    redirect("/unwanted");
}

/** 要らないリストのアイテムを既存プロジェクトに再紐付け */
export async function reassignItemToProject(itemId: string, formData: FormData) {
    const { userId } = await auth();
    if (!userId) return;

    const projectId = formData.get("projectId") as string;
    if (!projectId) return;

    // プロジェクトが本人のものか確認
    const [ownerProject] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
    if (!ownerProject) return;

    // 対象アイテムが本人のもの & 要らないリスト内（projectId is null）か確認
    const [target] = await db
        .select({ id: items.id })
        .from(items)
        .where(and(eq(items.id, itemId), eq(items.userId, userId), isNull(items.projectId)));
    if (!target) return;

    await db
        .update(items)
        .set({ projectId, isTradeable: false })
        .where(eq(items.id, itemId));

    revalidatePath(`/item/${itemId}`);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/unwanted");
    redirect(`/projects/${projectId}`);
}
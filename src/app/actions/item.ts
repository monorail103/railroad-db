"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { items, projects } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Scale } from "@/lib/item-scale";

type ItemType = "SET" | "SINGLE_CAR" | "PART";

export async function updateItemById(itemId: string, formData: FormData) {
    const { userId } = await auth();
    if (!userId) return;

    const nextProjectId = formData.get("projectId") as string;
    const type = formData.get("type") as ItemType;
    const maker = (formData.get("maker") as string) ?? "";
    const name = (formData.get("name") as string) ?? "";
    const scale = formData.get("scale") as Scale;
    const amount = Number(formData.get("amount"));
    const price = (formData.get("price") as string) ?? "";
    const remarks = (formData.get("remarks") as string) ?? "";
    const photoUrl = (formData.get("photoUrl") as string) ?? "";

    if (!nextProjectId || !name.trim() || !type || !scale || !Number.isInteger(amount) || amount < 1) {
        return;
    }

    // 移動先プロジェクトが本人のものか確認
    const [ownerProject] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, nextProjectId), eq(projects.userId, userId)));
    if (!ownerProject) return;

    // 対象アイテムが本人のものか確認し、現在のプロジェクトIDを取得
    const [targetItem] = await db
        .select({ id: items.id, currentProjectId: items.projectId })
        .from(items)
        .innerJoin(projects, eq(items.projectId, projects.id))
        .where(and(eq(items.id, itemId), eq(projects.userId, userId)));
    if (!targetItem) return;

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
        })
        .where(eq(items.id, itemId));

    revalidatePath(`/item/${itemId}`);
    revalidatePath(`/projects/${targetItem.currentProjectId}`);
    revalidatePath(`/projects/${nextProjectId}`);
    redirect(`/item/${itemId}?updated=1`);
}
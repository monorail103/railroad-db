"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { projects, items, wanted } from "@/db/schema";
import { revalidatePath } from "next/cache";
import type { Scale } from "@/lib/item-scale";

export async function createProject(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const name = formData.get("projectName") as string;
  if (!name) return;

  try {
    await db.insert(projects).values({
      userId,
      name,
      status: "IN_PROGRESS",
    });
    revalidatePath("/");
  } catch (error) {
    console.error("Failed to create project:", error);
    throw new Error("プロジェクトの作成に失敗しました");
  }
}

  // 所有品の追加
export async function handleAddItem(projectId: string, formData: FormData) {
  const type = formData.get("type") as "SET" | "SINGLE_CAR" | "PART";
  const maker = formData.get("maker") as string;
  const name = formData.get("name") as string;
  const scale = formData.get("scale") as Scale;
  const remarks = formData.get("remarks") as string;

  if (!name || !type || !scale) return;

  await db.insert(items).values({
    projectId,
    type,
    maker: maker?.trim() || null,
    name,
    remarks: remarks?.trim() || null,
    scale,
  });
  revalidatePath(`/projects/${projectId}`);
}

// WANTEDの追加
export async function handleAddWanted(projectId: string, formData: FormData) {
  const maker = formData.get("maker") as string;
  const name = formData.get("name") as string;
  const scale = formData.get("scale") as Scale;
  const remarks = formData.get("remarks") as string;
  const storeUrl = formData.get("storeUrl") as string;

  if (!name || !scale) return;

  await db.insert(wanted).values({ 
    projectId, 
    maker: maker?.trim() || null,
    name, 
    scale, 
    remarks,
    storeUrl: storeUrl?.trim() || null,
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function handleMoveWantedToItem(projectId: string, formData: FormData) {
  "use server";

  const { userId: actionUserId } = await auth();
  if (!actionUserId) return;

  const wantedId = formData.get("wantedId") as string;
  const type = formData.get("type") as "SET" | "SINGLE_CAR" | "PART";
  const maker = (formData.get("maker") as string) ?? "";

  if (!wantedId || !type) return;

  // 他人のプロジェクトに対する操作防止
  const [actionProject] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, actionUserId)));
  if (!actionProject) return;

  const [targetWanted] = await db
    .select({ id: wanted.id, maker: wanted.maker, name: wanted.name, scale: wanted.scale })
    .from(wanted)
    .where(and(eq(wanted.id, wantedId), eq(wanted.projectId, projectId)));
  if (!targetWanted) return;

  await db.insert(items).values({
    projectId,
    type,
    maker: maker.trim() || targetWanted.maker || null,
    name: targetWanted.name,
    scale: targetWanted.scale,
  });

  await db
    .delete(wanted)
    .where(and(eq(wanted.id, wantedId), eq(wanted.projectId, projectId)));

  revalidatePath(`/projects/${projectId}`);
}
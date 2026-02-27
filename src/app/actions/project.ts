"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { revalidatePath } from "next/cache";

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
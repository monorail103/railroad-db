"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { friendships, profiles } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function sendRequest(formData: FormData) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const [myProfile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    if (!myProfile) return;

    const targetCode = formData.get("friendCode") as string;
    if (!targetCode || targetCode === myProfile.friendCode) return;

    // コードから相手のユーザーを探す
    const [targetProfile] = await db.select().from(profiles).where(eq(profiles.friendCode, targetCode));
    if (!targetProfile) return; // 該当なし

    // 既に申請済み・フレンド済みかチェック（簡易版）
    const existing = await db.select().from(friendships).where(
        or(
            and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, targetProfile.userId)),
            and(eq(friendships.requesterId, targetProfile.userId), eq(friendships.addresseeId, userId))
        )
    );
    if (existing.length > 0) return;

    // 申請レコードを作成
    await db.insert(friendships).values({
        requesterId: userId,
        addresseeId: targetProfile.userId,
        status: "PENDING",
    });
    revalidatePath("/friends");
}

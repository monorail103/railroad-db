"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { items, projects, wanted } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Scale } from "@/lib/item-scale";

async function getOwnedWantedItem(wantedId: string, userId: string) {
	const [wantedItem] = await db
		.select({
			id: wanted.id,
			maker: wanted.maker,
			name: wanted.name,
			scale: wanted.scale,
			remarks: wanted.remarks,
			amount: wanted.amount,
			projectId: wanted.projectId,
		})
		.from(wanted)
		.innerJoin(projects, eq(wanted.projectId, projects.id))
		.where(and(eq(wanted.id, wantedId), eq(projects.userId, userId)));

	return wantedItem;
}

export async function updateWantedById(wantedId: string, formData: FormData) {
	const { userId } = await auth();
	if (!userId) return;

	const target = await getOwnedWantedItem(wantedId, userId);
	if (!target) return;

	const maker = formData.get("maker") as string;
	const name = formData.get("name") as string;
	const scale = formData.get("scale") as Scale;
	const remarks = formData.get("remarks") as string;
	const amount = parseInt(formData.get("amount") as string, 10);
	const storeUrl = formData.get("storeUrl") as string;

	if (!name || !scale || isNaN(amount)) return;

	await db
		.update(wanted)
		.set({
			maker: maker?.trim() || null,
			name,
			scale,
			remarks,
			amount,
			storeUrl: storeUrl?.trim() || null,
		})
		.where(eq(wanted.id, wantedId));

	revalidatePath(`/wanted/${wantedId}`);
	revalidatePath("/wanted");
	revalidatePath(`/projects/${target.projectId}`);
	redirect(`/wanted/${wantedId}?updated=1`);
}

export async function deleteWantedById(wantedId: string) {
	const { userId } = await auth();
	if (!userId) return;

	const target = await getOwnedWantedItem(wantedId, userId);
	if (!target) return;

	await db.delete(wanted).where(eq(wanted.id, wantedId));
	revalidatePath("/wanted");
	revalidatePath(`/projects/${target.projectId}`);
	redirect("/wanted");
}

export async function moveWantedToItemById(wantedId: string, formData: FormData) {
	const { userId } = await auth();
	if (!userId) return;

	const target = await getOwnedWantedItem(wantedId, userId);
	if (!target) return;

	const type = formData.get("type") as "SET" | "SINGLE_CAR" | "PART";
	const maker = (formData.get("maker") as string) ?? "";

	if (!type) return;

	await db.insert(items).values({
		projectId: target.projectId,
		type,
		maker: maker.trim() || target.maker || null,
		name: target.name,
		scale: target.scale as Scale,
		amount: target.amount,
	});

	await db.delete(wanted).where(eq(wanted.id, wantedId));

	revalidatePath("/wanted");
	revalidatePath(`/projects/${target.projectId}`);
	redirect(`/projects/${target.projectId}`);
}

export async function registerWantedPurchaseById(wantedId: string, formData: FormData) {
	const { userId } = await auth();
	if (!userId) return;

	const target = await getOwnedWantedItem(wantedId, userId);
	if (!target) return;

	const type = formData.get("type") as "SET" | "SINGLE_CAR" | "PART";
	const maker = (formData.get("maker") as string) ?? "";
	const price = (formData.get("price") as string) ?? "";
	const remarks = (formData.get("remarks") as string) ?? "";

	if (!type) return;

	await db.insert(items).values({
		projectId: target.projectId,
		type,
		maker: maker.trim() || target.maker || null,
		name: target.name,
		scale: target.scale as Scale,
		amount: target.amount,
		price: price.trim() || null,
		remarks: remarks.trim() || target.remarks || null,
	});

	await db.delete(wanted).where(eq(wanted.id, wantedId));

	revalidatePath("/wanted");
	revalidatePath(`/projects/${target.projectId}`);
	redirect(`/projects/${target.projectId}`);
}

export async function quickPurchaseWanted(formData: FormData) {
	const { userId } = await auth();
	if (!userId) return;

	const wantedId = formData.get("wantedId") as string;
	const type = (formData.get("type") as "SET" | "SINGLE_CAR" | "PART") || "SINGLE_CAR";
	const price = ((formData.get("price") as string) ?? "").trim();

	if (!wantedId) return;

	const target = await getOwnedWantedItem(wantedId, userId);
	if (!target) return;

	await db.insert(items).values({
		projectId: target.projectId,
		type,
		maker: target.maker,
		name: target.name,
		scale: target.scale as Scale,
		amount: target.amount,
		remarks: target.remarks,
		price: price || null,
	});

	await db.delete(wanted).where(eq(wanted.id, wantedId));

	revalidatePath("/wanted");
	revalidatePath(`/projects/${target.projectId}`);
	revalidatePath(`/wanted/${wantedId}`);
	redirect(`/wanted?updated=1`);
}

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { items, projects } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import UpdateSuccessToast from "../../_components/UpdateSuccessToast";

type Scale = "N" | "HO" | "PLARAIL" | "DECAL" | "PART_N" | "PART_HO" | "OTHER";
type ItemType = "SET" | "SINGLE_CAR" | "PART";

const scaleLabels: Record<Scale, string> = {
	N: "Nゲージ",
	HO: "HOゲージ",
	PLARAIL: "プラレール",
	DECAL: "インレタ/シール",
	PART_N: "Nパーツ",
	PART_HO: "HOパーツ",
	OTHER: "その他",
};

const itemTypeLabels: Record<ItemType, string> = {
	SINGLE_CAR: "単品車両",
	SET: "セット",
	PART: "パーツ",
};

export default async function ItemDetailPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ updated?: string }>;
}) {
	const { userId } = await auth();
	if (!userId) return <div>ログインしてください</div>;

	const resolvedParams = await params;
	const resolvedSearchParams = await searchParams;
	const showUpdatedToast = resolvedSearchParams.updated === "1";
	const itemId = resolvedParams.id;

	const [itemDetail] = await db
		.select({
			id: items.id,
			projectId: items.projectId,
			type: items.type,
			maker: items.maker,
			name: items.name,
			scale: items.scale,
			amount: items.amount,
			price: items.price,
			remarks: items.remarks,
			photoUrl: items.photoUrl,
			projectName: projects.name,
		})
		.from(items)
		.innerJoin(projects, eq(items.projectId, projects.id))
		.where(and(eq(items.id, itemId), eq(projects.userId, userId)));

	if (!itemDetail) notFound();

	const userProjects = await db
		.select({ id: projects.id, name: projects.name })
		.from(projects)
		.where(eq(projects.userId, userId));
    
    // サーバーアクション：所有品の情報を更新する
	async function handleUpdateItem(formData: FormData) {
		"use server";

		const { userId: actionUserId } = await auth();
		if (!actionUserId) return;

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

		const [ownerProject] = await db
			.select({ id: projects.id })
			.from(projects)
			.where(and(eq(projects.id, nextProjectId), eq(projects.userId, actionUserId)));
		if (!ownerProject) return;

		const [targetItem] = await db
			.select({ id: items.id, currentProjectId: items.projectId })
			.from(items)
			.innerJoin(projects, eq(items.projectId, projects.id))
			.where(and(eq(items.id, itemId), eq(projects.userId, actionUserId)));
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

	return (
		<main className="min-h-screen p-4 sm:p-8 max-w-2xl mx-auto pb-16">
			<UpdateSuccessToast show={showUpdatedToast} />
			<div className="mb-6 flex items-center gap-4">
				<Link href={`/projects/${itemDetail.projectId}`} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-xl">
					←
				</Link>
				<h1 className="text-2xl font-bold">所有品 詳細</h1>
			</div>

			<section className="bg-white border rounded-xl p-6 shadow-sm mb-8">
				<div className="flex justify-between items-start gap-4 mb-4">
					<div className="min-w-0">
						{itemDetail.maker && <div className="text-sm text-slate-500 mb-1 break-words">{itemDetail.maker}</div>}
						<h2 className="text-2xl font-bold text-slate-900 break-words">{itemDetail.name}</h2>
					</div>
					<div className="flex flex-col gap-2 items-end shrink-0">
						<span className="bg-slate-200 text-slate-700 text-xs px-3 py-1 rounded-full font-bold">
							{itemTypeLabels[itemDetail.type as ItemType] ?? itemDetail.type}
						</span>
						<span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-bold">
							{scaleLabels[itemDetail.scale as Scale] ?? itemDetail.scale}
						</span>
					</div>
				</div>

				<div className="mb-5">
					<div className="text-sm text-slate-500 mb-1">所属プロジェクト</div>
					<Link
						href={`/projects/${itemDetail.projectId}`}
						className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline font-medium bg-blue-50 px-3 py-2 rounded-lg transition-colors"
					>
						📁 {itemDetail.projectName}
					</Link>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
						<div className="text-sm text-slate-500 mb-1">数量</div>
						<div className="text-xl font-bold text-slate-800">{itemDetail.amount}</div>
					</div>
					<div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
						<div className="text-sm text-slate-500 mb-1">価格</div>
						<div className="text-slate-700 break-words">{itemDetail.price || <span className="text-slate-400 italic">未設定</span>}</div>
					</div>
				</div>

				<div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
					<div className="text-sm text-slate-500 mb-1">備考</div>
					<div className="text-slate-700 whitespace-pre-wrap break-words">
						{itemDetail.remarks || <span className="text-slate-400 italic">メモなし</span>}
					</div>
				</div>
			</section>

			{itemDetail.photoUrl && (
				<section className="mb-8">
					<div className="bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
						<img src={itemDetail.photoUrl} alt={itemDetail.name} className="w-full h-auto object-cover" />
					</div>
				</section>
			)}

			<section className="bg-white border rounded-xl p-6 shadow-sm">
				<h3 className="text-lg font-bold mb-4 text-slate-800">詳細情報を編集する</h3>

				<form action={handleUpdateItem} className="flex flex-col gap-4">
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">所属プロジェクト</label>
						<select name="projectId" defaultValue={itemDetail.projectId} className="border p-2 rounded w-full" required>
							{userProjects.map((project) => (
								<option key={project.id} value={project.id}>
									{project.name}
								</option>
							))}
						</select>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">種別</label>
							<select name="type" defaultValue={itemDetail.type} className="border p-2 rounded w-full" required>
								<option value="SINGLE_CAR">単品車両</option>
								<option value="SET">セット</option>
								<option value="PART">パーツ</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">スケール</label>
							<select name="scale" defaultValue={itemDetail.scale} className="border p-2 rounded w-full" required>
								<option value="N">N</option>
								<option value="HO">HO</option>
								<option value="PLARAIL">プラレール</option>
								<option value="DECAL">インレタ/シール</option>
								<option value="PART_N">Nパーツ</option>
								<option value="PART_HO">HOパーツ</option>
								<option value="OTHER">その他</option>
							</select>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">メーカー</label>
							<input
								type="text"
								name="maker"
								defaultValue={itemDetail.maker || ""}
								className="border p-2 rounded w-full"
								placeholder="例: KATO"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">品名</label>
							<input
								type="text"
								name="name"
								defaultValue={itemDetail.name}
								className="border p-2 rounded w-full"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">数量</label>
							<input
								type="number"
								name="amount"
								min="1"
								step="1"
								defaultValue={itemDetail.amount}
								className="border p-2 rounded w-full"
								required
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">価格</label>
							<input
								type="text"
								name="price"
								defaultValue={itemDetail.price || ""}
								className="border p-2 rounded w-full"
								placeholder="例: 2500円"
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">画像URL</label>
						<input
							type="url"
							name="photoUrl"
							defaultValue={itemDetail.photoUrl || ""}
							className="border p-2 rounded w-full"
							placeholder="例: https://example.com/item.jpg"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">備考</label>
						<textarea
							name="remarks"
							defaultValue={itemDetail.remarks || ""}
							className="border p-2 rounded w-full h-24 resize-y"
							placeholder="メモを入力"
						/>
					</div>

					<div className="flex justify-end">
						<button
							type="submit"
							className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded font-medium transition-colors"
						>
							更新を保存
						</button>
					</div>
				</form>
			</section>
		</main>
	);
}

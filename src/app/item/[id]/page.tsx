import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { items, projects } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import UpdateSuccessToast from "../../_components/UpdateSuccessToast";
import { BackLink } from "../../_components/BackLink";
import { ITEM_SCALE_LABELS, ITEM_SCALE_OPTIONS, type Scale } from "@/lib/item-scale";
import { ITEM_TYPE_LABELS, ITEM_TYPE_OPTIONS } from "@/lib/item-type";
import { updateItemById, moveItemToUnwanted, reassignItemToProject } from "@/app/actions/item";
import { MoveToUnwantedForm } from "../../_components/MoveToUnwantedForm";

export default async function ItemDetailPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ updated?: string }>;
}) {
	const { userId } = await auth();
	if (!userId) return <div>ログインしてください</div>;

	const { id: itemId } = await params;
	const { updated } = await searchParams;

	const [detail] = await db
		.select({
			id: items.id, projectId: items.projectId, type: items.type,
			maker: items.maker, name: items.name, scale: items.scale,
			amount: items.amount, price: items.price, remarks: items.remarks,
			photoUrl: items.photoUrl, isTradeable: items.isTradeable,
			projectName: projects.name,
		})
		.from(items)
		.leftJoin(projects, eq(items.projectId, projects.id))
		.where(and(eq(items.id, itemId), eq(items.userId, userId)));

	if (!detail) notFound();

	const isUnwanted = !detail.projectId;
	const canMoveToUnwanted = !isUnwanted
		&& detail.type !== "PART"
		&& !["DECAL", "PART_N", "PART_HO"].includes(detail.scale);

	const userProjects = await db
		.select({ id: projects.id, name: projects.name })
		.from(projects)
		.where(eq(projects.userId, userId));

	const updateAction = updateItemById.bind(null, itemId);
	const unwantedAction = moveItemToUnwanted.bind(null, itemId);
	const reassignAction = reassignItemToProject.bind(null, itemId);

	return (
		<main className="min-h-screen p-4 sm:p-8 max-w-2xl mx-auto pb-16">
			<UpdateSuccessToast show={updated === "1"} />
			{isUnwanted ? (
				<BackLink href="/unwanted" label="要らないリストに戻る" />
			) : (
				<BackLink href={`/projects/${detail.projectId}`} label="プロジェクトに戻る" />
			)}
			<h1 className="text-2xl font-bold mb-6">所有品 詳細</h1>

			{/* 情報カード */}
			<section className="bg-white border rounded-xl p-6 shadow-sm mb-8">
				<div className="flex justify-between items-start gap-4 mb-4">
					<div className="min-w-0">
						{detail.maker && <div className="text-sm text-slate-500 mb-1 break-words">{detail.maker}</div>}
						<h2 className="text-2xl font-bold text-slate-900 break-words">{detail.name}</h2>
					</div>
					<div className="flex flex-col gap-2 items-end shrink-0">
						<span className="bg-slate-200 text-slate-700 text-xs px-3 py-1 rounded-full font-bold">
							{ITEM_TYPE_LABELS[detail.type] ?? detail.type}
						</span>
						<span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-bold">
							{ITEM_SCALE_LABELS[detail.scale as Scale] ?? detail.scale}
						</span>
					</div>
				</div>

				<div className="mb-5">
					<div className="text-sm text-slate-500 mb-1">所属プロジェクト</div>
					{isUnwanted ? (
						<span className="inline-flex items-center gap-2 text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">
							🗑️ 要らないリスト（トレード可）
						</span>
					) : (
						<Link href={`/projects/${detail.projectId}`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline font-medium bg-blue-50 px-3 py-2 rounded-lg transition-colors">
							📁 {detail.projectName}
						</Link>
					)}
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
						<div className="text-sm text-slate-500 mb-1">数量</div>
						<div className="text-xl font-bold text-slate-800">{detail.amount}</div>
					</div>
					<div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
						<div className="text-sm text-slate-500 mb-1">価格</div>
						<div className="text-slate-700 break-words">{detail.price || <span className="text-slate-400 italic">未設定</span>}</div>
					</div>
				</div>

				<div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
					<div className="text-sm text-slate-500 mb-1">備考</div>
					<div className="text-slate-700 whitespace-pre-wrap break-words">
						{detail.remarks || <span className="text-slate-400 italic">メモなし</span>}
					</div>
				</div>
			</section>

			{detail.photoUrl && (
				<section className="mb-8">
					<div className="bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
						<img src={detail.photoUrl} alt={detail.name} className="w-full h-auto object-cover" />
					</div>
				</section>
			)}

			{/* 要らないリスト行きフォーム */}
			{canMoveToUnwanted && (
				<section className="mb-6">
					<MoveToUnwantedForm
						action={unwantedAction}
						currentRemarks={detail.remarks}
						currentPrice={detail.price}
					/>
				</section>
			)}

			{isUnwanted && userProjects.length > 0 && (
				<section className="bg-white border border-green-200 rounded-xl p-6 shadow-sm mb-8">
					<h3 className="text-lg font-bold mb-3 text-green-800">プロジェクトに再紐付け</h3>
					<form action={reassignAction} className="flex flex-col sm:flex-row gap-3">
						<select name="projectId" className="border border-green-300 bg-white p-2 rounded-lg flex-1 text-sm" required>
							<option value="">プロジェクトを選択...</option>
							{userProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
						</select>
						<button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shadow-sm hover:shadow transition-all">
							紐付け
						</button>
					</form>
				</section>
			)}

			{/* 編集フォーム */}
			<section className="bg-white border rounded-xl p-6 shadow-sm">
				<h3 className="text-lg font-bold mb-4 text-slate-800">詳細情報を編集する</h3>
				<form action={updateAction} className="flex flex-col gap-4">
					{isUnwanted ? (
						<input type="hidden" name="projectId" value="" />
					) : (
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">所属プロジェクト</label>
							<select name="projectId" defaultValue={detail.projectId ?? ""} className="border p-2 rounded w-full" required>
								{userProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
							</select>
						</div>
					)}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">種別</label>
							<select name="type" defaultValue={detail.type} className="border p-2 rounded w-full" required>
								{ITEM_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">スケール</label>
							<select name="scale" defaultValue={detail.scale} className="border p-2 rounded w-full" required>
								{ITEM_SCALE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
							</select>
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">メーカー</label>
							<input type="text" name="maker" defaultValue={detail.maker || ""} className="border p-2 rounded w-full" placeholder="例: KATO" />
						</div>
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">品名</label>
							<input type="text" name="name" defaultValue={detail.name} className="border p-2 rounded w-full" required />
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">数量</label>
							<input type="number" name="amount" min="1" step="1" defaultValue={detail.amount} className="border p-2 rounded w-full" required />
						</div>
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">価格</label>
							<input type="text" name="price" defaultValue={detail.price || ""} className="border p-2 rounded w-full" placeholder="例: 2500円" />
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">画像URL</label>
						<input type="url" name="photoUrl" defaultValue={detail.photoUrl || ""} className="border p-2 rounded w-full" placeholder="例: https://example.com/item.jpg" />
					</div>
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">備考</label>
						<textarea name="remarks" defaultValue={detail.remarks || ""} className="border p-2 rounded w-full h-24 resize-y" placeholder="メモを入力" />
					</div>
					<div className="flex justify-end">
						<button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded font-medium transition-colors">更新を保存</button>
					</div>
				</form>
			</section>
		</main>
	);
}

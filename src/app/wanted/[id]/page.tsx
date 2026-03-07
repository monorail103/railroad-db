import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { projects, wanted } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import UpdateSuccessToast from "../../_components/UpdateSuccessToast";
import { BackLink } from "../../_components/BackLink";
import { DeleteButton } from "../../_components/DeleteButton";
import { ITEM_SCALE_LABELS, ITEM_SCALE_OPTIONS, type Scale } from "@/lib/item-scale";
import { ITEM_TYPE_OPTIONS } from "@/lib/item-type";
import {
  deleteWantedById,
  moveWantedToItemById,
  registerWantedPurchaseById,
  updateWantedById,
} from "@/app/actions/wanted";

export default async function WantedDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return <div>ログインしてください</div>;

  const { id: wantedId } = await params;
  const { updated } = await searchParams;

  const [item] = await db
    .select({
      id: wanted.id, maker: wanted.maker, name: wanted.name, scale: wanted.scale,
      remarks: wanted.remarks, amount: wanted.amount, photoUrl: wanted.photoUrl,
      storeUrl: wanted.storeUrl, projectId: wanted.projectId, projectName: projects.name,
    })
    .from(wanted)
    .innerJoin(projects, eq(wanted.projectId, projects.id))
    .where(and(eq(wanted.id, wantedId), eq(projects.userId, userId)));

  if (!item) notFound();

  const updateAction = updateWantedById.bind(null, wantedId);
  const deleteAction = deleteWantedById.bind(null, wantedId);
  const moveAction = moveWantedToItemById.bind(null, wantedId);
  const purchaseAction = registerWantedPurchaseById.bind(null, wantedId);

  const typeOptions = ITEM_TYPE_OPTIONS.map((o) => (
    <option key={o.value} value={o.value}>{o.label}</option>
  ));

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-2xl mx-auto pb-20">
      <UpdateSuccessToast show={updated === "1"} />
      <BackLink href="/wanted" label="WANTED一覧に戻る" />
      <h1 className="text-2xl font-bold mb-6">WANTED 詳細</h1>

      {/* 情報表示 */}
      <section className="bg-white border rounded-xl p-6 shadow-sm mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            {item.maker && <div className="text-sm text-slate-500 mb-1">{item.maker}</div>}
            <h2 className="text-2xl font-bold text-slate-900">{item.name}</h2>
          </div>
          <span className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full font-bold whitespace-nowrap ml-4">
            {ITEM_SCALE_LABELS[item.scale as Scale] ?? item.scale}
          </span>
        </div>

        <div className="mb-6">
          <div className="text-sm text-slate-500 mb-1">関連プロジェクト</div>
          <Link href={`/projects/${item.projectId}`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline font-medium bg-blue-50 px-3 py-2 rounded-lg transition-colors">
            📁 {item.projectName}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="text-sm text-slate-500 mb-1">希望数量</div>
            <div className="text-xl font-bold text-slate-800">{item.amount}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="text-sm text-slate-500 mb-1">備考・メモ</div>
            <div className="text-slate-700 whitespace-pre-wrap">
              {item.remarks || <span className="text-slate-400 italic">メモなし</span>}
            </div>
          </div>
        </div>

        {/* 所有品へ移行 */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-lg font-bold mb-4 text-slate-800">✨ 入手しましたか？</h3>

          <form action={moveAction} className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800 mb-3">このアイテムを入手した場合、所有品リストへ移行できます。</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <select name="type" defaultValue="SINGLE_CAR" className="border border-blue-200 p-2 rounded text-sm w-full sm:w-auto bg-white" required>{typeOptions}</select>
              <input type="text" name="maker" placeholder="メーカー (任意)" className="border border-blue-200 p-2 rounded w-full sm:flex-1 min-w-0 text-sm bg-white" />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-colors shadow-sm">所有品へ移行</button>
            </div>
          </form>

          <form action={purchaseAction} className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 mt-4">
            <p className="text-sm text-emerald-800 mb-3">価格を含めて、購入済みとしてすぐに登録できます。</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <select name="type" defaultValue="SINGLE_CAR" className="border border-emerald-200 p-2 rounded text-sm w-full bg-white" required>{typeOptions}</select>
              <input type="text" name="maker" placeholder="メーカー (任意)" defaultValue={item.maker || ""} className="border border-emerald-200 p-2 rounded w-full text-sm bg-white" />
              <input type="text" name="price" placeholder="購入価格 (例: 1500円)" className="border border-emerald-200 p-2 rounded w-full text-sm bg-white" />
              <input type="text" name="remarks" placeholder="購入メモ (任意)" className="border border-emerald-200 p-2 rounded w-full text-sm bg-white" />
            </div>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-colors shadow-sm">購入登録して所有品へ移行</button>
          </form>
        </div>
      </section>

      {item.photoUrl && (
        <div className="mb-8">
          <div className="bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
            <img src={item.photoUrl} alt={item.name} className="w-full h-auto object-cover" />
          </div>
        </div>
      )}

      {/* 編集フォーム */}
      <section className="bg-white border rounded-xl p-6 shadow-sm mb-8">
        <h3 className="text-lg font-bold mb-4 text-slate-800">情報を編集する</h3>
        <form action={updateAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">メーカー</label>
              <input type="text" name="maker" defaultValue={item.maker || ""} className="border p-2 rounded w-full" placeholder="例: KATO" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">品名</label>
              <input type="text" name="name" defaultValue={item.name} className="border p-2 rounded w-full" required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">スケール</label>
              <select name="scale" defaultValue={item.scale} className="border p-2 rounded w-full" required>
                {ITEM_SCALE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">数量</label>
              <input type="number" name="amount" defaultValue={item.amount} min="1" className="border p-2 rounded w-full" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">購入予定の店舗URL</label>
            <input type="url" name="storeUrl" defaultValue={item.storeUrl || ""} className="border p-2 rounded w-full" placeholder="例: https://www.example.com/item/12345" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">備考</label>
            <textarea name="remarks" defaultValue={item.remarks || ""} className="border p-2 rounded w-full h-24 resize-y" placeholder="例: 1500円以下なら即買い" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded font-medium transition-colors">更新を保存</button>
          </div>
        </form>
      </section>

      {/* 削除 */}
      <div className="border border-red-100 bg-red-50 rounded-xl p-6 text-center">
        <h3 className="text-red-800 font-bold mb-2">危険な操作</h3>
        <p className="text-sm text-red-600 mb-4">このWANTEDアイテムを削除します。この操作は取り消せません。</p>
        <DeleteButton action={deleteAction} label="WANTEDを削除する" />
      </div>
    </main>
  );
}

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { projects, wanted, items } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

type Scale = "N" | "HO" | "PLARAIL" | "DECAL" | "PART_N" | "PART_HO" | "OTHER";

const scaleLabels: Record<Scale, string> = {
  N: "Nゲージ",
  HO: "HOゲージ",
  PLARAIL: "プラレール",
  DECAL: "インレタ/シール",
  PART_N: "Nパーツ",
  PART_HO: "HOパーツ",
  OTHER: "その他",
};

export default async function WantedDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return <div>ログインしてください</div>;

  const resolvedParams = await params;
  const wantedId = resolvedParams.id;

  // WANTEDアイテムと紐づくプロジェクトを取得
  const [wantedItem] = await db
    .select({
      id: wanted.id,
      maker: wanted.maker,
      name: wanted.name,
      scale: wanted.scale,
      remarks: wanted.remarks,
      amount: wanted.amount,
      projectId: wanted.projectId,
      projectName: projects.name,
    })
    .from(wanted)
    .innerJoin(projects, eq(wanted.projectId, projects.id))
    .where(and(eq(wanted.id, wantedId), eq(projects.userId, userId)));

  if (!wantedItem) notFound();

  // --- Server Actions ---

  // WANTEDの更新
  async function handleUpdateWanted(formData: FormData) {
    "use server";
    const maker = formData.get("maker") as string;
    const name = formData.get("name") as string;
    const scale = formData.get("scale") as Scale;
    const remarks = formData.get("remarks") as string;
    const amount = parseInt(formData.get("amount") as string, 10);

    if (!name || !scale || isNaN(amount)) return;

    await db
      .update(wanted)
      .set({ maker: maker?.trim() || null, name, scale, remarks, amount })
      .where(eq(wanted.id, wantedId));
    
    revalidatePath(`/wanted/${wantedId}`);
    revalidatePath("/wanted");
    revalidatePath(`/projects/${wantedItem.projectId}`);
  }

  // WANTEDの削除
  async function handleDeleteWanted() {
    "use server";
    await db.delete(wanted).where(eq(wanted.id, wantedId));
    revalidatePath("/wanted");
    revalidatePath(`/projects/${wantedItem.projectId}`);
    redirect("/wanted");
  }

  // WANTED → 所有品（items）へ移行
  async function handleMoveWantedToItem(formData: FormData) {
    "use server";
    const type = formData.get("type") as "SET" | "SINGLE_CAR" | "PART";
    const maker = (formData.get("maker") as string) ?? "";

    if (!type) return;

    await db.insert(items).values({
      projectId: wantedItem.projectId,
      type,
      maker: maker.trim() || wantedItem.maker || null,
      name: wantedItem.name,
      scale: wantedItem.scale as Scale,
      amount: wantedItem.amount,
    });

    await db.delete(wanted).where(eq(wanted.id, wantedId));

    revalidatePath("/wanted");
    revalidatePath(`/projects/${wantedItem.projectId}`);
    redirect(`/projects/${wantedItem.projectId}`);
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-2xl mx-auto pb-20">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/wanted" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-xl">
          ←
        </Link>
        <h1 className="text-2xl font-bold">WANTED 詳細</h1>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            {wantedItem.maker && (
              <div className="text-sm text-slate-500 mb-1">{wantedItem.maker}</div>
            )}
            <h2 className="text-2xl font-bold text-slate-900">{wantedItem.name}</h2>
          </div>
          <span className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full font-bold whitespace-nowrap ml-4">
            {scaleLabels[wantedItem.scale as Scale] ?? wantedItem.scale}
          </span>
        </div>

        <div className="mb-6">
          <div className="text-sm text-slate-500 mb-1">関連プロジェクト</div>
          <Link 
            href={`/projects/${wantedItem.projectId}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline font-medium bg-blue-50 px-3 py-2 rounded-lg transition-colors"
          >
            📁 {wantedItem.projectName}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="text-sm text-slate-500 mb-1">希望数量</div>
            <div className="text-xl font-bold text-slate-800">{wantedItem.amount}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="text-sm text-slate-500 mb-1">備考・メモ</div>
            <div className="text-slate-700 whitespace-pre-wrap">
              {wantedItem.remarks || <span className="text-slate-400 italic">メモなし</span>}
            </div>
          </div>
        </div>

        {/* 所有品へ移行フォーム */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2">
            ✨ 入手しましたか？
          </h3>
          <form action={handleMoveWantedToItem} className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800 mb-3">
              このアイテムを入手した場合、所有品リストへ移行できます。
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                name="type"
                className="border border-blue-200 p-2 rounded text-sm w-full sm:w-auto bg-white"
                defaultValue="SINGLE_CAR"
                required
              >
                <option value="SINGLE_CAR">単品車両</option>
                <option value="SET">セット</option>
                <option value="PART">パーツ</option>
              </select>
              <input
                type="text"
                name="maker"
                placeholder="メーカー (任意)"
                className="border border-blue-200 p-2 rounded w-full sm:flex-1 min-w-0 text-sm bg-white"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium w-full sm:w-auto whitespace-nowrap transition-colors shadow-sm"
              >
                所有品へ移行
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 編集フォーム */}
      <div className="bg-white border rounded-xl p-6 shadow-sm mb-8">
        <h3 className="text-lg font-bold mb-4 text-slate-800">情報を編集する</h3>
        <form action={handleUpdateWanted} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">メーカー</label>
              <input
                type="text"
                name="maker"
                defaultValue={wantedItem.maker || ""}
                className="border p-2 rounded w-full"
                placeholder="例: KATO"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">品名</label>
              <input
                type="text"
                name="name"
                defaultValue={wantedItem.name}
                className="border p-2 rounded w-full"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">スケール</label>
              <select name="scale" defaultValue={wantedItem.scale} className="border p-2 rounded w-full" required>
                <option value="N">N</option>
                <option value="HO">HO</option>
                <option value="PLARAIL">プラレール</option>
                <option value="DECAL">インレタ/シール</option>
                <option value="PART_N">Nパーツ</option>
                <option value="PART_HO">HOパーツ</option>
                <option value="OTHER">その他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">数量</label>
              <input
                type="number"
                name="amount"
                defaultValue={wantedItem.amount}
                min="1"
                className="border p-2 rounded w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">備考</label>
            <textarea
              name="remarks"
              defaultValue={wantedItem.remarks || ""}
              className="border p-2 rounded w-full h-24 resize-y"
              placeholder="例: 1500円以下なら即買い"
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
      </div>

      {/* 削除ボタン */}
      <div className="border border-red-100 bg-red-50 rounded-xl p-6 text-center">
        <h3 className="text-red-800 font-bold mb-2">危険な操作</h3>
        <p className="text-sm text-red-600 mb-4">
          このWANTEDアイテムを削除します。この操作は取り消せません。
        </p>
        <form action={handleDeleteWanted}>
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            WANTEDを削除する
          </button>
        </form>
      </div>
    </main>
  );
}

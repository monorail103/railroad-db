import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { projects, items, wanted } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { handleAddItem, handleAddWanted, handleMoveWantedToItem } from "@/app/actions/project";
import Link from "next/link";
import { ITEM_SCALE_LABELS, ITEM_SCALE_OPTIONS, type Scale } from "@/lib/item-scale";

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return <div>ログインしてください</div>;

  // URLからプロジェクトのIDを取得
  const resolvedParams = await params;
  const projectId = resolvedParams.id;

  // 1. プロジェクト本体の取得（他人のデータを見れないように userId も条件に入れる）
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

  if (!project) notFound();

  // 2. 紐づく所有品（items）と手配リスト（wanted）を取得
  const projectItems = await db.select().from(items).where(eq(items.projectId, projectId));
  const projectWanted = await db.select().from(wanted).where(eq(wanted.projectId, projectId));

  // --- 画面UI ---
  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">← 一覧に戻る</Link>
      </div>
      
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <p className="text-gray-500 mt-2">ステータス: {project.status}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 左側：所有品（Items）エリア */}
        <section className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">手持ちの車両・パーツ</h2>    
          
          <form action={(formData) => handleAddItem(projectId, formData)} className="mb-6 flex flex-col gap-2">
            {/* 1行目: 種別 + スケール */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
              <select name="type" className="border p-2 rounded w-full sm:w-auto" required>
                <option value="SINGLE_CAR">単品車両</option>
                <option value="SET">セット</option>
                <option value="PART">パーツ</option>
              </select>
              <select name="scale" className="border p-2 rounded w-full sm:w-auto" defaultValue="N" required>
                {ITEM_SCALE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 2行目: メーカー + 品名 */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
              <input
                type="text"
                name="maker"
                placeholder="メーカー (例: KATO)"
                className="border p-2 rounded w-full sm:w-44"
              />
              <input
                type="text"
                name="name"
                placeholder="品名 (例: モハ102-xxx)"
                className="border p-2 rounded w-full sm:flex-1 min-w-0"
                required
              />
            </div>

            {/* 3行目: 備考（大きめ） + 追加 */}
            <div className="flex flex-col sm:flex-row gap-2">
              <textarea
                name="remarks"
                placeholder="備考 (例: 1500円以下なら即買い)"
                className="border p-2 rounded w-full sm:flex-1 min-w-0 h-24 resize-y"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto whitespace-nowrap"
              >
                追加
              </button>
            </div>
          </form>

          <ul className="space-y-2 list-none">
            {projectItems.map(item => (
              <li key={item.id} className="p-2 border-b text-sm">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-gray-200 text-xs px-2 py-1 rounded whitespace-nowrap">
                      {item.type}
                    </span>
                    <span className="bg-gray-100 text-xs px-2 py-1 rounded whitespace-nowrap">
                      {ITEM_SCALE_LABELS[item.scale as Scale] ?? item.scale}
                    </span>
                  </div>
                  <div className="min-w-0 break-words">
                    {item.maker && <span className="text-gray-600 mr-2">[{item.maker}]</span>}
                    <Link href={`/item/${item.id}`} className="font-medium hover:text-blue-600 hover:underline">
                      {item.name}
                    </Link>
                  </div>
                </div>
              </li>
            ))}
            {projectItems.length === 0 && (
              <li className="text-gray-500 text-sm">まだ登録されていません。</li>
            )}
          </ul>
        </section>

        {/* 右側：WANTEDエリア */}
        <section className="bg-yellow-50 p-6 rounded-lg shadow-sm border border-yellow-200">
          <h2 className="text-xl font-bold mb-4 border-b border-yellow-300 pb-2 text-yellow-800">WANTED (手配リスト)</h2>
          
          <form action={(formData) => handleAddWanted(projectId, formData)} className="mb-6 flex flex-col gap-2">
            {/* 1行目: スケール + メーカー + 品名 */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
              <select name="scale" className="border border-yellow-300 p-2 rounded bg-white w-full sm:w-auto" required>
                {ITEM_SCALE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="maker"
                placeholder="メーカー (例: KATO)"
                className="border border-yellow-300 p-2 rounded w-full sm:w-44"
              />
              <input
                type="text"
                name="name"
                placeholder="探している物 (例: モハ103)"
                className="border border-yellow-300 p-2 rounded w-full sm:flex-1 min-w-0"
                required
              />
            </div>

            {/* 2行目: 商品URL */}
            <div>
              <input
                type="url"
                name="storeUrl"
                className="border border-yellow-300 p-2 rounded w-full"
                placeholder="商品URL"
              />
            </div>

            {/* 3行目: 備考（大きめ） + 追加 */}
            <div className="flex flex-col sm:flex-row gap-2">
              <textarea
                name="remarks"
                placeholder="備考 (例: 旧製品を優先的に探す)"
                className="border border-yellow-300 p-2 rounded w-full sm:flex-1 min-w-0 h-24 resize-y"
              />
              <button
                type="submit"
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded font-bold w-full sm:w-auto whitespace-nowrap"
              >
                追加
              </button>
            </div>
          </form>

          <ul className="space-y-3 list-none">
            {projectWanted.map(w => (
              <li key={w.id} className="p-3 bg-white border border-yellow-300 rounded shadow-sm">
                <div className="flex flex-col gap-2">
                  <div>
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-xs font-bold text-yellow-800 bg-yellow-100 px-2 py-1 rounded mt-0.5 shrink-0">
                        {ITEM_SCALE_LABELS[w.scale as Scale] ?? w.scale}
                      </span>
                      <div className="font-semibold text-gray-900 break-words min-w-0 leading-snug">
                        {w.maker && <span className="text-xs text-gray-500 block mb-0.5">{w.maker}</span>}
                        <Link href={`/wanted/${w.id}`} className="hover:text-blue-600 hover:underline">
                          {w.name}
                        </Link>
                      </div>
                    </div>
                    {w.remarks && (
                      <div className="text-sm text-gray-600 mt-1 break-words">📝 {w.remarks}</div>
                    )}
                  </div>

                  <form action={(formData) => handleMoveWantedToItem(projectId, formData)} className="flex flex-col gap-2">
                    <input type="hidden" name="wantedId" value={w.id} />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        name="type"
                        className="border border-yellow-300 p-2 rounded text-sm w-full sm:w-auto"
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
                        className="border border-yellow-300 p-2 rounded w-full sm:flex-1 min-w-0 text-sm"
                      />
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm w-full sm:w-auto whitespace-nowrap"
                      >
                        所有品へ移行
                      </button>
                    </div>
                  </form>
                </div>
              </li>
            ))}
            {projectWanted.length === 0 && (
              <li className="text-gray-500 text-sm">現在探しているものはありません。</li>
            )}
          </ul>
        </section>

      </div>
    </main>
  );
}
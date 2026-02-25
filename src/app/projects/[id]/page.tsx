import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { projects, items, wanted } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import Link from "next/link";

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

  // --- Server Actions（DB書き込み処理） ---

  // 所有品の追加
  async function handleAddItem(formData: FormData) {
    "use server";
    const type = formData.get("type") as "SET" | "SINGLE_CAR" | "PART";
    const maker = formData.get("maker") as string;
    const name = formData.get("name") as string;

    if (!name || !type) return;

    await db.insert(items).values({ projectId, type, maker, name });
    revalidatePath(`/projects/${projectId}`);
  }

  // WANTEDの追加
  async function handleAddWanted(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const remarks = formData.get("remarks") as string;

    if (!name) return;

    await db.insert(wanted).values({ projectId, name, remarks });
    revalidatePath(`/projects/${projectId}`);
  }

  // --- 画面UI ---
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
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
          
          <form action={handleAddItem} className="mb-6 flex flex-col gap-2">
            <div className="flex gap-2">
              <select name="type" className="border p-2 rounded" required>
                <option value="SINGLE_CAR">単品車両</option>
                <option value="SET">セット</option>
                <option value="PART">パーツ</option>
              </select>
              <input type="text" name="maker" placeholder="メーカー (例: KATO)" className="border p-2 rounded w-1/3" />
            </div>
            <div className="flex gap-2">
              <input type="text" name="name" placeholder="品名 (例: モハ102-xxx)" className="border p-2 rounded flex-1" required />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">追加</button>
            </div>
          </form>

          <ul className="space-y-2">
            {projectItems.map(item => (
              <li key={item.id} className="p-2 border-b flex justify-between items-center text-sm">
                <div>
                  <span className="bg-gray-200 text-xs px-2 py-1 rounded mr-2">{item.type}</span>
                  <span className="text-gray-600 mr-2">[{item.maker}]</span>
                  <span className="font-medium">{item.name}</span>
                </div>
              </li>
            ))}
            {projectItems.length === 0 && <p className="text-gray-500 text-sm">まだ登録されていません。</p>}
          </ul>
        </section>

        {/* 右側：WANTEDエリア */}
        <section className="bg-yellow-50 p-6 rounded-lg shadow-sm border border-yellow-200">
          <h2 className="text-xl font-bold mb-4 border-b border-yellow-300 pb-2 text-yellow-800">WANTED (手配リスト)</h2>
          
          <form action={handleAddWanted} className="mb-6 flex flex-col gap-2">
            <input type="text" name="name" placeholder="探している物 (例: モハ103)" className="border border-yellow-300 p-2 rounded flex-1" required />
            <div className="flex gap-2">
              <input type="text" name="remarks" placeholder="備考 (例: 1500円以下なら即買い)" className="border border-yellow-300 p-2 rounded flex-1 text-sm" />
              <button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded">WANTED登録</button>
            </div>
          </form>

          <ul className="space-y-3">
            {projectWanted.map(w => (
              <li key={w.id} className="p-3 bg-white border border-yellow-300 rounded shadow-sm">
                <div className="font-bold text-red-600">{w.name}</div>
                {w.remarks && <div className="text-sm text-gray-600 mt-1">📝 {w.remarks}</div>}
              </li>
            ))}
            {projectWanted.length === 0 && <p className="text-gray-500 text-sm">現在探しているものはありません。</p>}
          </ul>
        </section>

      </div>
    </main>
  );
}
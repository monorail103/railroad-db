import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function Home() {
  // 1. Clerkから現在ログインしているユーザーのIDを取得
  const { userId } = await auth();

  // 2. ログインしていれば、自分のプロジェクトだけをDBから取得
  const myProjects = userId 
    ? await db.select().from(projects).where(eq(projects.userId, userId))
    : [];

  const statusMeta = {
    IN_PROGRESS: { label: "進行中", badge: "bg-blue-100 text-blue-800" },
    COMPLETED: { label: "完成", badge: "bg-green-100 text-green-800" },
    ARCHIVED: { label: "保管", badge: "bg-gray-100 text-gray-800" },
  } as const;
  type ProjectStatus = keyof typeof statusMeta;

  const counts = myProjects.reduce(
    (acc, p) => {
      const status = (p.status as ProjectStatus) ?? "IN_PROGRESS";
      if (status === "IN_PROGRESS") acc.inProgress += 1;
      else if (status === "COMPLETED") acc.completed += 1;
      else if (status === "ARCHIVED") acc.archived += 1;
      else acc.unknown += 1;
      acc.total += 1;
      return acc;
    },
    { total: 0, inProgress: 0, completed: 0, archived: 0, unknown: 0 }
  );

  // 3. フォーム送信時に動くサーバーアクション（API不要で直接DB書き込み）
  async function createProject(formData: FormData) {
    "use server";
    const { userId } = await auth();
    if (!userId) return;

    const name = formData.get("projectName") as string;
    if (!name) return;

    // DBに新規プロジェクトをインサート

    try {
      await db.insert(projects).values({
        userId,
        name,
        status: "IN_PROGRESS",
      });
    } catch (error) {
      console.error("プロジェクトの作成に失敗:", error);
      return;
    }

    // 画面を最新状態に更新
    revalidatePath("/");
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto">
      <SignedIn>
        <section className="space-y-8">
          <header className="rounded-lg border bg-white p-6 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              🚆 コレクションを、編成ごとに走らせるように管理
            </h1>
            <p className="text-gray-700 mt-3 leading-relaxed">
              プロジェクト（編成）単位で「手持ち」と「WANTED」をまとめて、買い忘れ・重複購入を減らします。
            </p>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="border rounded p-3 bg-gray-50">
                <div className="text-xs text-gray-600">合計</div>
                <div className="text-xl font-bold">{counts.total}</div>
              </div>
              <div className="border rounded p-3 bg-blue-50">
                <div className="text-xs text-blue-700">進行中</div>
                <div className="text-xl font-bold text-blue-900">{counts.inProgress}</div>
              </div>
              <div className="border rounded p-3 bg-green-50">
                <div className="text-xs text-green-700">完成</div>
                <div className="text-xl font-bold text-green-900">{counts.completed}</div>
              </div>
              <div className="border rounded p-3 bg-gray-50">
                <div className="text-xs text-gray-700">保管</div>
                <div className="text-xl font-bold text-gray-900">{counts.archived}</div>
              </div>
            </div>
          </header>

          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">新しいプロジェクトを作成</h2>
            <p className="text-sm text-gray-600 mt-1">
              例: 「阪急9300系 8両化」「205系 南武線」「部品ストック整理」
            </p>

            <form action={createProject} className="flex flex-col sm:flex-row gap-2 mt-4">
              <input
                type="text"
                name="projectName"
                placeholder="プロジェクト名を入力"
                className="border p-2 rounded flex-1 text-black min-w-0"
                required
              />
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded whitespace-nowrap">
                追加
              </button>
            </form>
          </section>

          <section className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                🛒 WANTED 一覧（お買い物メモ）
              </h2>
            </div>
            <Link 
              href="/wanted" 
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all text-center whitespace-nowrap"
            >
              WANTEDを見る
            </Link>
          </section>

          <section>
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold">あなたのプロジェクト</h2>
              <div className="text-sm text-gray-600">クリックで詳細へ</div>
            </div>

            {myProjects.length === 0 ? (
              <div className="border rounded-lg p-6 bg-gray-50">
                <p className="text-gray-700 font-medium">まだプロジェクトがありません。</p>
                <p className="text-sm text-gray-600 mt-2">
                  まずは1つ作って、手持ち（車両・パーツ）とWANTED（手配リスト）を登録していきましょう。
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {myProjects.map((p) => {
                  const status = (p.status as ProjectStatus) ?? "IN_PROGRESS";
                  const meta = statusMeta[status] ?? statusMeta.IN_PROGRESS;

                  return (
                    <li key={p.id} className="border rounded-lg bg-white shadow-sm hover:bg-gray-50 transition">
                      <Link href={`/projects/${p.id}`} className="flex justify-between items-center gap-3 p-4 w-full">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.name}</div>
                          <div className="text-xs text-gray-500 mt-1">編成 / 企画 / 収集テーマ</div>
                        </div>
                        <span className={`text-sm px-2 py-1 rounded whitespace-nowrap ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </section>
      </SignedIn>

      <SignedOut>
        <section className="mt-10 sm:mt-20">
          <div className="rounded-lg border bg-white p-6 shadow-sm max-w-3xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">🚆 鉄道模型コレクション管理</h1>
            <p className="text-gray-700 mt-3 leading-relaxed">
              編成ごとに「手持ち」と「WANTED」を整理して、買い物と整備の計画をスムーズに。
            </p>
            <ul className="mt-4 text-sm text-gray-700 space-y-1">
              <li>・プロジェクト（編成）単位で管理</li>
              <li>・手配リスト → 所有品への移行が簡単</li>
              <li>・フレンドとWANTEDを共有</li>
            </ul>
            <p className="text-center text-gray-600 mt-6">
              右上の「ログイン」から始めましょう。
            </p>
          </div>
        </section>
      </SignedOut>
    </main>
  );
}
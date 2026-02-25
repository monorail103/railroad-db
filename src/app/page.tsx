import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
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

  // 3. フォーム送信時に動くサーバーアクション（API不要で直接DB書き込み）
  async function createProject(formData: FormData) {
    "use server";
    const { userId } = await auth();
    if (!userId) return;

    const name = formData.get("projectName") as string;
    if (!name) return;

    // DBに新規プロジェクトをインサート
    await db.insert(projects).values({
      userId,
      name,
      status: "IN_PROGRESS",
    });

    // 画面を最新状態に更新
    revalidatePath("/");
  }

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold">鉄道模型コレクション管理</h1>
        {/* Clerkの認証UIコンポーネント */}
        <SignedOut>
          <SignInButton mode="modal">
            <button className="bg-blue-600 text-white px-4 py-2 rounded">ログイン</button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>

      <SignedIn>
        <section>
          <h2 className="text-xl font-semibold mb-4">新しいプロジェクトを作成</h2>
          <form action={createProject} className="flex gap-2 mb-8">
            <input 
              type="text" 
              name="projectName" 
              placeholder="例: 阪急9300系 8両化" 
              className="border p-2 rounded flex-1 text-black"
              required 
            />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
              追加
            </button>
          </form>

          <h2 className="text-xl font-semibold mb-4">進行中のプロジェクト</h2>
          {myProjects.length === 0 ? (
            <p className="text-gray-500">プロジェクトがありません。</p>
          ) : (
            <ul className="space-y-3">
              {myProjects.map((p) => (
                <li key={p.id} className="border p-4 rounded shadow-sm hover:bg-gray-50 transition">
                  {/* Linkで詳細ページへ遷移 */}
                  <Link href={`/projects/${p.id}`} className="flex justify-between items-center w-full">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {p.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </SignedIn>

      <SignedOut>
        <p className="text-center text-gray-600 mt-20">
          ログインしてコレクションの管理を始めましょう。
        </p>
      </SignedOut>
    </main>
  );
}
import { db } from "@/db";
import { projects, wanted } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import UpdateSuccessToast from "../_components/UpdateSuccessToast";
import { WantedCard } from "../_components/WantedCard";
import { BackLink } from "../_components/BackLink";
import { EmptyState } from "../_components/EmptyState";

export default async function WantedPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const { userId } = await auth();
  const { updated } = await searchParams;

  if (!userId) {
    return <div className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto text-center"><p>ログインしてください</p></div>;
  }

  const myWantedList = await db
    .select({
      id: wanted.id,
      maker: wanted.maker,
      name: wanted.name,
      scale: wanted.scale,
      remarks: wanted.remarks,
      amount: wanted.amount,
      photoUrl: wanted.photoUrl,
      storeUrl: wanted.storeUrl,
      projectId: projects.id,
      projectName: projects.name,
    })
    .from(wanted)
    .innerJoin(projects, eq(wanted.projectId, projects.id))
    .where(eq(projects.userId, userId))
    .orderBy(desc(wanted.createdAt));

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto pb-20">
      <UpdateSuccessToast show={updated === "1"} />
      <BackLink href="/" label="ホームに戻る" />
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">🛒 WANTED 一覧</h1>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 text-sm text-blue-800">
        <p className="font-medium mb-1">💡 お買い物メモとして活用できます</p>
        <p>地下の模型店やイベント会場など、電波が悪い場所でも確認しやすいように、すべてのWANTEDをここにまとめています。</p>
      </div>

      {myWantedList.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="現在、WANTEDに登録されているアイテムはありません。"
          description="各プロジェクトのページから、探している車両やパーツを登録しましょう。"
          action={{ label: "プロジェクト一覧へ戻る", href: "/" }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myWantedList.map((item) => (
            <WantedCard key={item.id} {...item} />
          ))}
        </div>
      )}
    </main>
  );
}

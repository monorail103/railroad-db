import { db } from "@/db";
import { projects, wanted } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function WantedPage() {
  const { userId } = await auth();
  if (!userId) {
    return (
      <div className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto text-center">
        <p>ログインしてください</p>
      </div>
    );
  }

  // ユーザーのプロジェクトに紐づくWANTEDを取得
  const myWantedList = await db
    .select({
      id: wanted.id,
      maker: wanted.maker,
      name: wanted.name,
      scale: wanted.scale,
      remarks: wanted.remarks,
      amount: wanted.amount,
      projectId: projects.id,
      projectName: projects.name,
    })
    .from(wanted)
    .innerJoin(projects, eq(wanted.projectId, projects.id))
    .where(eq(projects.userId, userId))
    .orderBy(desc(wanted.createdAt));

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-xl">
          ←
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🛒 WANTED 一覧
        </h1>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 text-sm text-blue-800">
        <p className="font-medium mb-1">💡 お買い物メモとして活用できます</p>
        <p>地下の模型店やイベント会場など、電波が悪い場所でも確認しやすいように、すべてのWANTEDをここにまとめています。</p>
      </div>

      {myWantedList.length === 0 ? (
        <div className="border rounded-lg p-8 bg-white text-center shadow-sm">
          <div className="text-4xl mb-4">🛒</div>
          <p className="text-slate-700 font-medium">現在、WANTEDに登録されているアイテムはありません。</p>
          <p className="text-sm text-slate-500 mt-2">
            各プロジェクトのページから、探している車両やパーツを登録しましょう。
          </p>
          <Link 
            href="/" 
            className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors"
          >
            プロジェクト一覧へ戻る
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myWantedList.map((item) => (
            <Link 
              key={item.id} 
              href={`/wanted/${item.id}`}
              className="block border rounded-xl p-4 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="min-w-0">
                  {item.maker && (
                    <div className="text-xs text-slate-500 mb-0.5">{item.maker}</div>
                  )}
                  <h2 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {item.name}
                  </h2>
                </div>
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium whitespace-nowrap ml-2 shrink-0">
                  {item.scale}
                </span>
              </div>
              
              <div className="text-sm text-slate-500 mb-3 flex items-center gap-1">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">プロジェクト</span>
                <span className="truncate">{item.projectName}</span>
              </div>

              <div className="flex justify-between items-end mt-auto pt-2 border-t border-slate-100">
                <div className="text-sm text-slate-600 line-clamp-1 flex-1 mr-4">
                  {item.remarks ? item.remarks : <span className="text-slate-400 italic">メモなし</span>}
                </div>
                <div className="text-sm font-medium bg-slate-50 px-3 py-1 rounded-full whitespace-nowrap">
                  数量: <span className="text-lg font-bold text-slate-800">{item.amount}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

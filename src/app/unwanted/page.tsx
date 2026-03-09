import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { items, projects } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { BackLink } from "@/app/_components/BackLink";
import { ITEM_SCALE_LABELS, type Scale } from "@/lib/item-scale";
import { ITEM_TYPE_LABELS } from "@/lib/item-type";
import { reassignItemToProject } from "@/app/actions/item";
import { ShareButtons } from "@/app/_components/ShareButtons";

export default async function UnwantedPage() {
  const { userId } = await auth();
  if (!userId) return <div>ログインしてください</div>;

  const unwantedItems = await db
    .select()
    .from(items)
    .where(and(eq(items.userId, userId), isNull(items.projectId), eq(items.isTradeable, true)));

  const userProjects = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(eq(projects.userId, userId));

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto">
      <BackLink href="/" label="一覧に戻る" />

      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2">
          🗑️ 要らないリスト
          <span className="text-base font-normal text-slate-500">({unwantedItems.length}件)</span>
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          プロジェクトから外されたトレード可能なアイテムです。既存のプロジェクトに再紐付けできます。
        </p>
        {unwantedItems.length > 0 && (
          <div className="mt-4">
            <ShareButtons
              items={unwantedItems.map((item) => ({
                name: item.name,
                maker: item.maker,
                scale: ITEM_SCALE_LABELS[item.scale as Scale] ?? item.scale,
                type: ITEM_TYPE_LABELS[item.type] ?? item.type,
              }))}
            />
          </div>
        )}
      </header>

      {unwantedItems.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-xl shadow-sm">
          <div className="text-4xl mb-3">✨</div>
          <p className="text-slate-500">要らないリストは空です</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {unwantedItems.map((item) => {
            const reassignAction = reassignItemToProject.bind(null, item.id);
            return (
              <li key={item.id} className="bg-white border border-red-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="bg-slate-200 text-slate-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          {ITEM_TYPE_LABELS[item.type] ?? item.type}
                        </span>
                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          {ITEM_SCALE_LABELS[item.scale as Scale] ?? item.scale}
                        </span>
                        <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          トレード可
                        </span>
                      </div>
                      {item.maker && <div className="text-xs text-slate-500">{item.maker}</div>}
                      <Link
                        href={`/item/${item.id}`}
                        className="font-bold text-lg text-slate-800 hover:text-blue-600 hover:underline"
                      >
                        {item.name}
                      </Link>
                      {item.remarks && (
                        <div className="text-sm text-slate-500 mt-1 break-words">📝 {item.remarks}</div>
                      )}
                    </div>
                  </div>

                  {userProjects.length > 0 && (
                    <form action={reassignAction} className="flex flex-col sm:flex-row gap-2 border-t border-red-100 pt-3">
                      <select name="projectId" className="border border-green-300 bg-white p-2 rounded-lg flex-1 text-sm" required>
                        <option value="">プロジェクトに再紐付け...</option>
                        {userProjects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shadow-sm hover:shadow transition-all"
                      >
                        紐付け
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

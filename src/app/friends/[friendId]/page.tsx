import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { profiles, friendships, wanted, projects, items } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ITEM_SCALE_LABELS, ITEM_SCALE_OPTIONS, type Scale } from "@/lib/item-scale";

export default async function FriendWantedPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ friendId: string }>;
  searchParams: Promise<{ scale?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const resolvedParams = await params;
  const friendId = resolvedParams.friendId;
  
  const resolvedSearchParams = await searchParams;
  const currentScale = resolvedSearchParams.scale || "ALL";

  // 1. 本当にフレンド（ACCEPTED）かどうかを強固にチェック
  const isFriend = await db.select().from(friendships).where(
    and(
      or(
        and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, friendId)),
        and(eq(friendships.addresseeId, userId), eq(friendships.requesterId, friendId))
      ),
      eq(friendships.status, "ACCEPTED")
    )
  );

  if (isFriend.length === 0) {
    return <div className="p-8 text-red-600 font-bold">アクセス権限がありません（相互フレンドのみ閲覧可能です）。</div>;
  }

  // 2. フレンドのプロフィールを取得
  const [friendProfile] = await db.select().from(profiles).where(eq(profiles.userId, friendId));
  if (!friendProfile) notFound();

  // 3. フレンドのWANTEDリストを、所属するプロジェクト名と一緒に一括取得
  const friendWantedQuery = db
    .select({
      id: wanted.id,
      name: wanted.name,
      scale: wanted.scale,
      remarks: wanted.remarks,
      projectName: projects.name,
    })
    .from(wanted)
    .innerJoin(projects, eq(wanted.projectId, projects.id))
    .where(eq(projects.userId, friendId));

  const friendWantedList = await friendWantedQuery;

  // 4. フレンドのプロジェクト一覧と紐づく所有品（items）を取得
  const friendProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
    })
    .from(projects)
    .where(eq(projects.userId, friendId));

  const friendItems = await db
    .select({
      id: items.id,
      projectId: items.projectId,
      type: items.type,
      maker: items.maker,
      name: items.name,
      scale: items.scale,
      amount: items.amount,
      remarks: items.remarks,
    })
    .from(items)
    .innerJoin(projects, eq(items.projectId, projects.id))
    .where(eq(projects.userId, friendId));

  const itemsByProjectId = new Map<string, Array<(typeof friendItems)[number]>>();
  for (const item of friendItems) {
    if (item.projectId) {
      const current = itemsByProjectId.get(item.projectId) ?? [];
      current.push(item);
      itemsByProjectId.set(item.projectId, current);
    }
  }

  // 5. TypeScript側でスケール絞り込み（DBクエリで絞り込んでもOKですが、今回はシンプルに配列をフィルタ）
  const filteredList = currentScale === "ALL" 
    ? friendWantedList 
    : friendWantedList.filter(w => w.scale === currentScale);

  const scaleFilters: Array<{ value: string; label: string }> = [
    { value: "ALL", label: "すべて" },
    ...ITEM_SCALE_OPTIONS,
  ];

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/friends" className="text-blue-600 hover:underline">← フレンド一覧に戻る</Link>
      </div>

      <header className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          👀 {friendProfile.displayName} さんのWANTEDリスト
        </h1>
      </header>

      {/* スケール絞り込みフィルター（URLパラメータを使って再描画） */}
      <div className="mb-6 flex flex-wrap gap-2">
        {scaleFilters.map(({ value, label }) => (
          <Link 
            key={value} 
            href={`/friends/${friendId}${value === "ALL" ? "" : `?scale=${value}`}`}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              currentScale === value 
                ? "bg-blue-600 text-white shadow-md" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* WANTED一覧表示 */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <p className="text-gray-500 bg-gray-50 p-6 rounded text-center">
            {currentScale === "ALL" ? "WANTEDリストは空です。" : "このスケールのWANTEDはありません。"}
          </p>
        ) : (
          filteredList.map((item) => (
            <div key={item.id} className="bg-white border-l-4 border-yellow-400 p-4 rounded shadow-sm">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-yellow-800 bg-yellow-100 px-2 py-1 rounded mr-2">
                    {ITEM_SCALE_LABELS[item.scale as Scale] ?? item.scale}
                  </span>
                  <span className="font-bold text-lg break-words">{item.name}</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                📁 プロジェクト: <span className="font-medium">{item.projectName}</span>
              </div>
              {item.remarks && (
                <div className="mt-2 text-sm bg-gray-50 p-2 rounded text-gray-700 border break-words">
                  📝 {item.remarks}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* プロジェクトと紐づく所有品（items）一覧 */}
      <section className="mt-10">
        <header className="mb-4 border-b pb-2">
          <h2 className="text-xl font-bold">📁 プロジェクト & 所有品</h2>
        </header>

        {friendProjects.length === 0 ? (
          <p className="text-gray-500 bg-gray-50 p-6 rounded text-center">
            プロジェクトはまだ登録されていません。
          </p>
        ) : (
          <div className="space-y-4">
            {friendProjects.map((project) => {
              const projectItems = itemsByProjectId.get(project.id) ?? [];

              return (
                <div key={project.id} className="bg-white border rounded p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="font-bold text-lg">{project.name}</span>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {project.status}
                    </span>
                  </div>

                  {projectItems.length === 0 ? (
                    <p className="text-sm text-gray-500">このプロジェクトに所有品はまだありません。</p>
                  ) : (
                    <ul className="space-y-2">
                      {projectItems.map((item) => (
                        <li key={item.id} className="border-l-4 border-blue-200 bg-blue-50/40 p-3 rounded">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">{item.type}</span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {ITEM_SCALE_LABELS[item.scale as Scale] ?? item.scale}
                            </span>
                            <span className="text-xs bg-white border px-2 py-1 rounded">数量: {item.amount}</span>
                          </div>
                          <div className="mt-1 break-words">
                            {item.maker && <span className="text-gray-600 mr-2">[{item.maker}]</span>}
                            <span className="font-medium">{item.name}</span>
                          </div>
                          {item.remarks && (
                            <div className="mt-2 text-sm bg-white border p-2 rounded text-gray-700 break-words">
                              📝 {item.remarks}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
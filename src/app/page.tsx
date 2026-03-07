import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createProject } from "./actions/project";
import Link from "next/link";
import { ProjectCard } from "./_components/ProjectCard";
import { EmptyState } from "./_components/EmptyState";
import { type ProjectStatus } from "@/lib/project-status";

const STAT_CARDS = [
  { key: "total",      label: "合計",  bg: "bg-gray-50",  xs: "text-gray-600", xl: "" },
  { key: "inProgress", label: "進行中", bg: "bg-blue-50",  xs: "text-blue-700", xl: "text-blue-900" },
  { key: "completed",  label: "完成",  bg: "bg-green-50", xs: "text-green-700", xl: "text-green-900" },
  { key: "archived",   label: "保管",  bg: "bg-gray-50",  xs: "text-gray-700", xl: "text-gray-900" },
] as const;

export default async function Home() {
  const { userId } = await auth();
  const myProjects = userId
    ? await db.select().from(projects).where(eq(projects.userId, userId))
    : [];

  const counts = myProjects.reduce(
    (acc, p) => {
      const s = (p.status as ProjectStatus) ?? "IN_PROGRESS";
      acc.total += 1;
      if (s === "IN_PROGRESS") acc.inProgress += 1;
      else if (s === "COMPLETED") acc.completed += 1;
      else if (s === "ARCHIVED") acc.archived += 1;
      return acc;
    },
    { total: 0, inProgress: 0, completed: 0, archived: 0 },
  );

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
              {STAT_CARDS.map((c) => (
                <div key={c.key} className={`border rounded p-3 ${c.bg}`}>
                  <div className={`text-xs ${c.xs}`}>{c.label}</div>
                  <div className={`text-xl font-bold ${c.xl}`}>{counts[c.key]}</div>
                </div>
              ))}
            </div>
          </header>

          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">新しいプロジェクトを作成</h2>
            <p className="text-sm text-gray-600 mt-1">例: 「阪急9300系 8両化」「205系 南武線」「部品ストック整理」</p>
            <form action={createProject} className="flex flex-col sm:flex-row gap-2 mt-4">
              <input type="text" name="projectName" placeholder="プロジェクト名を入力" className="border p-2 rounded flex-1 text-black min-w-0" required />
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded whitespace-nowrap">追加</button>
            </form>
          </section>

          <section className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">🛒 WANTED 一覧（お買い物メモ）</h2>
            <Link href="/wanted" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all text-center whitespace-nowrap">
              WANTEDを見る
            </Link>
          </section>

          <section>
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold">あなたのプロジェクト</h2>
              <div className="text-sm text-gray-600">クリックで詳細へ</div>
            </div>
            {myProjects.length === 0 ? (
              <EmptyState
                title="まだプロジェクトがありません。"
                description="まずは1つ作って、手持ち（車両・パーツ）とWANTED（手配リスト）を登録していきましょう。"
              />
            ) : (
              <ul className="space-y-3">
                {myProjects.map((p) => (
                  <ProjectCard key={p.id} id={p.id} name={p.name} status={p.status} />
                ))}
              </ul>
            )}
          </section>
        </section>
      </SignedIn>

      <SignedOut>
        <section className="mt-10 sm:mt-20">
          <EmptyState
            icon="🚆"
            title="鉄道模型コレクション管理"
            description="編成ごとに「手持ち」と「WANTED」を整理して、買い物と整備の計画をスムーズに。右上の「ログイン」から始めましょう。"
          />
        </section>
      </SignedOut>
    </main>
  );
}
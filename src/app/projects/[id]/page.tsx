import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { projects, items, wanted } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BackLink } from "@/app/_components/BackLink";
import { AddItemForm } from "./_components/AddItemForm";
import { AddWantedForm } from "./_components/AddWantedForm";
import { ItemList } from "./_components/ItemList";
import { WantedList } from "./_components/WantedList";
import { STATUS_META, type ProjectStatus } from "@/lib/project-status";

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return <div>ログインしてください</div>;

  const { id: projectId } = await params;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

  if (!project) notFound();

  const [projectItems, projectWanted] = await Promise.all([
    db.select().from(items).where(eq(items.projectId, projectId)),
    db.select().from(wanted).where(eq(wanted.projectId, projectId)),
  ]);

  const meta = STATUS_META[(project.status as ProjectStatus) ?? "IN_PROGRESS"];

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto">
      <BackLink href="/" label="一覧に戻る" />

      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <p className="text-gray-500 mt-2">ステータス: <span className={`text-sm px-2 py-1 rounded ${meta.badge}`}>{meta.label}</span></p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 左側：所有品（Items）エリア */}
        <section className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">手持ちの車両・パーツ</h2>
          <AddItemForm projectId={projectId} />
          <ItemList items={projectItems} />
        </section>

        {/* 右側：WANTEDエリア */}
        <section className="bg-yellow-50 p-6 rounded-lg shadow-sm border border-yellow-200">
          <h2 className="text-xl font-bold mb-4 border-b border-yellow-300 pb-2 text-yellow-800">
            WANTED (手配リスト)
          </h2>
          <AddWantedForm projectId={projectId} />
          <WantedList items={projectWanted} projectId={projectId} />
        </section>
      </div>
    </main>
  );
}
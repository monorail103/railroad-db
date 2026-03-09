import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { projects, items, wanted } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BackLink } from "@/app/_components/BackLink";
import { AddItemForm } from "../../_components/AddItemForm";
import { AddWantedForm } from "../../_components/AddWantedForm";
import { ItemList } from "../../_components/ItemList";
import { WantedList } from "../../_components/WantedList";
import { STATUS_META, type ProjectStatus } from "@/lib/project-status";
import { moveProjectToUnwanted } from "@/app/actions/project";
import { ProjectUnwantedForm } from "@/app/_components/ProjectUnwantedForm";

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
  const unwantedAction = moveProjectToUnwanted.bind(null, projectId);

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-5xl mx-auto">
      <BackLink href="/" label="一覧に戻る" />

      <header className="mb-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{project.name}</h1>
          <span className={`text-sm px-3 py-1.5 rounded-full font-medium self-start ${meta.badge}`}>{meta.label}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
            <div className="text-xs text-blue-600 font-medium">所有品</div>
            <div className="text-2xl font-bold text-blue-800">{projectItems.length}</div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
            <div className="text-xs text-amber-600 font-medium">WANTED</div>
            <div className="text-2xl font-bold text-amber-800">{projectWanted.length}</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200">
          <ProjectUnwantedForm action={unwantedAction} projectName={project.name} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側：所有品（Items）エリア */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🚃 手持ちの車両・パーツ
              <span className="text-blue-100 text-sm font-normal">({projectItems.length}件)</span>
            </h2>
          </div>
          <div className="p-5">
            <AddItemForm projectId={projectId} />
            <ItemList items={projectItems} />
          </div>
        </section>

        {/* 右側：WANTEDエリア */}
        <section className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🛒 WANTED（手配リスト）
              <span className="text-amber-100 text-sm font-normal">({projectWanted.length}件)</span>
            </h2>
          </div>
          <div className="p-5">
            <AddWantedForm projectId={projectId} />
            <WantedList items={projectWanted} projectId={projectId} />
          </div>
        </section>
      </div>
    </main>
  );
}
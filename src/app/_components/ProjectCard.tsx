import Link from "next/link";
import { STATUS_META, type ProjectStatus } from "@/lib/project-status";

type Props = {
  id: string;
  name: string;
  status: string;
};

/**
 * ホーム画面のプロジェクト一覧で使う1行カード。
 * クリックで /projects/[id] へ遷移する。
 */
export function ProjectCard({ id, name, status }: Props) {
  const meta =
    STATUS_META[status as ProjectStatus] ?? STATUS_META.IN_PROGRESS;

  return (
    <li className="border rounded-lg bg-white shadow-sm hover:bg-gray-50 transition">
      <Link
        href={`/projects/${id}`}
        className="flex justify-between items-center gap-3 p-4 w-full"
      >
        <div className="min-w-0">
          <div className="font-medium truncate">{name}</div>
          <div className="text-xs text-gray-500 mt-1">編成 / 企画 / 収集テーマ</div>
        </div>
        <span
          className={`text-sm px-2 py-1 rounded whitespace-nowrap ${meta.badge}`}
        >
          {meta.label}
        </span>
      </Link>
    </li>
  );
}

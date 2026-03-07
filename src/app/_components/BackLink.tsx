import Link from "next/link";

type Props = {
  href: string;
  label: string;
};

/**
 * 全ページ共通の「戻るリンク」。
 * ← アイコン + テキストのスタイルで統一。
 */
export function BackLink({ href, label }: Props) {
  return (
    <div className="mb-6">
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600 transition-colors"
      >
        <span aria-hidden>←</span>
        {label}
      </Link>
    </div>
  );
}

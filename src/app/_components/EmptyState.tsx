import Link from "next/link";

type Props = {
  /** 大きく表示する絵文字アイコン（省略可） */
  icon?: string;
  /** メインメッセージ */
  title: string;
  /** サブテキスト（省略可） */
  description?: string;
  /** CTAボタン（省略可） */
  action?: {
    label: string;
    href: string;
  };
};

/**
 * リストが空のとき共通で使う空状態UI。
 * icon / title / description / action を受け取りスタイルを統一する。
 */
export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="border rounded-lg p-8 bg-white text-center shadow-sm">
      {icon && <div className="text-4xl mb-4">{icon}</div>}
      <p className="text-slate-700 font-medium">{title}</p>
      {description && (
        <p className="text-sm text-slate-500 mt-2">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors text-sm"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

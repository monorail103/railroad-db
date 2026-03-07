import Link from "next/link";
import { ITEM_SCALE_OPTIONS } from "@/lib/item-scale";

type Props = {
  /** 現在選択されているスケール値。未選択は "ALL" */
  currentScale: string;
  /**
   * フィルターを適用するページのベースURL。
   * 例: "/wanted"  "/friends/abc123"
   * ?scale=XXX を末尾に付与して href を生成する。
   */
  baseHref: string;
};

const ALL_FILTER = { value: "ALL", label: "すべて" };

/**
 * スケール絞り込みフィルター（URLパラメータ方式）。
 * wanted/page と friends/[friendId] で共用する。
 */
export function ScaleFilter({ currentScale, baseHref }: Props) {
  const filters = [ALL_FILTER, ...ITEM_SCALE_OPTIONS];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(({ value, label }) => {
        const href =
          value === "ALL" ? baseHref : `${baseHref}?scale=${value}`;
        const isActive = currentScale === value;

        return (
          <Link
            key={value}
            href={href}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

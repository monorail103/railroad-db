import Link from "next/link";
import { ITEM_SCALE_LABELS, type Scale } from "@/lib/item-scale";

type Item = {
  id: string;
  type: string;
  maker: string | null;
  name: string;
  scale: string;
};

export function ItemList({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return <p className="text-gray-500 text-sm">まだ登録されていません。</p>;
  }

  return (
    <ul className="space-y-2 list-none">
      {items.map((item) => (
        <li key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                {item.type}
              </span>
              <span className="bg-slate-200 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                {ITEM_SCALE_LABELS[item.scale as Scale] ?? item.scale}
              </span>
            </div>
            <div className="min-w-0 break-words">
              {item.maker && (
                <span className="text-xs text-slate-500 block">{item.maker}</span>
              )}
              <Link
                href={`/item/${item.id}`}
                className="font-semibold text-slate-800 hover:text-blue-600 hover:underline"
              >
                {item.name}
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

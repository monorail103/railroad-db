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
        <li key={item.id} className="p-2 border-b text-sm">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-gray-200 text-xs px-2 py-1 rounded whitespace-nowrap">
                {item.type}
              </span>
              <span className="bg-gray-100 text-xs px-2 py-1 rounded whitespace-nowrap">
                {ITEM_SCALE_LABELS[item.scale as Scale] ?? item.scale}
              </span>
            </div>
            <div className="min-w-0 break-words">
              {item.maker && (
                <span className="text-gray-600 mr-2">[{item.maker}]</span>
              )}
              <Link
                href={`/item/${item.id}`}
                className="font-medium hover:text-blue-600 hover:underline"
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

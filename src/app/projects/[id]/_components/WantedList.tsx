import Link from "next/link";
import { handleMoveWantedToItem } from "@/app/actions/project";
import { ITEM_SCALE_LABELS, type Scale } from "@/lib/item-scale";

type WantedItem = {
  id: string;
  maker: string | null;
  name: string;
  scale: string;
  remarks: string | null;
};

export function WantedList({
  items,
  projectId,
}: {
  items: WantedItem[];
  projectId: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-gray-500 text-sm">現在探しているものはありません。</p>
    );
  }

  const moveAction = handleMoveWantedToItem.bind(null, projectId);

  return (
    <ul className="space-y-3 list-none">
      {items.map((w) => (
        <li
          key={w.id}
          className="p-3 bg-white border border-yellow-300 rounded shadow-sm"
        >
          <div className="flex flex-col gap-2">
            {/* アイテム情報 */}
            <div>
              <div className="flex items-start gap-2 min-w-0">
                <span className="text-xs font-bold text-yellow-800 bg-yellow-100 px-2 py-1 rounded mt-0.5 shrink-0">
                  {ITEM_SCALE_LABELS[w.scale as Scale] ?? w.scale}
                </span>
                <div className="font-semibold text-gray-900 break-words min-w-0 leading-snug">
                  {w.maker && (
                    <span className="text-xs text-gray-500 block mb-0.5">
                      {w.maker}
                    </span>
                  )}
                  <Link
                    href={`/wanted/${w.id}`}
                    className="hover:text-blue-600 hover:underline"
                  >
                    {w.name}
                  </Link>
                </div>
              </div>
              {w.remarks && (
                <div className="text-sm text-gray-600 mt-1 break-words">
                  📝 {w.remarks}
                </div>
              )}
            </div>

            {/* 所有品へ移行フォーム */}
            <form action={moveAction} className="flex flex-col gap-2">
              <input type="hidden" name="wantedId" value={w.id} />
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  name="type"
                  className="border border-yellow-300 p-2 rounded text-sm w-full sm:w-auto"
                  defaultValue="SINGLE_CAR"
                  required
                >
                  <option value="SINGLE_CAR">単品車両</option>
                  <option value="SET">セット</option>
                  <option value="PART">パーツ</option>
                </select>
                <input
                  type="text"
                  name="maker"
                  placeholder="メーカー (任意)"
                  className="border border-yellow-300 p-2 rounded w-full sm:flex-1 min-w-0 text-sm"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm w-full sm:w-auto whitespace-nowrap transition-colors"
                >
                  所有品へ移行
                </button>
              </div>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}

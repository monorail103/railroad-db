import Link from "next/link";
import { quickPurchaseWanted } from "@/app/actions/wanted";
import { ITEM_SCALE_LABELS, type Scale } from "@/lib/item-scale";

type Props = {
  id: string;
  name: string;
  maker: string | null;
  scale: string;
  remarks: string | null;
  amount: number;
  photoUrl: string | null;
  storeUrl: string | null;
  projectName: string;
};

/**
 * WANTED 一覧ページ（/wanted）で使うカード。
 * 詳細リンク・ストアURL・クイック購入フォームを内包する。
 */
export function WantedCard({
  id,
  name,
  maker,
  scale,
  remarks,
  amount,
  photoUrl,
  storeUrl,
  projectName,
}: Props) {
  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all group">
      {/* 詳細ページへのリンク */}
      <Link href={`/wanted/${id}`} className="block">
        {photoUrl && (
          <div className="mb-3 rounded-lg overflow-hidden bg-slate-100 h-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          </div>
        )}

        <div className="flex justify-between items-start mb-2">
          <div className="min-w-0">
            {maker && (
              <div className="text-xs text-slate-500 mb-0.5">{maker}</div>
            )}
            <h2 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {name}
            </h2>
          </div>
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium whitespace-nowrap ml-2 shrink-0">
            {ITEM_SCALE_LABELS[scale as Scale] ?? scale}
          </span>
        </div>

        <div className="text-sm text-slate-500 mb-3 flex items-center gap-1">
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
            プロジェクト
          </span>
          <span className="truncate">{projectName}</span>
        </div>

        <div className="flex justify-between items-end mt-auto pt-2 border-t border-slate-100">
          <div className="text-sm text-slate-600 line-clamp-1 flex-1 mr-4">
            {remarks ?? (
              <span className="text-slate-400 italic">メモなし</span>
            )}
          </div>
          <div className="text-sm font-medium bg-slate-50 px-3 py-1 rounded-full whitespace-nowrap">
            数量:{" "}
            <span className="text-lg font-bold text-slate-800">{amount}</span>
          </div>
        </div>
      </Link>

      {/* ストアURL */}
      {storeUrl && (
        <div className="mt-3">
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            ストアURLを開く
          </a>
        </div>
      )}

      {/* クイック購入フォーム */}
      <form
        action={quickPurchaseWanted}
        className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2"
      >
        <input type="hidden" name="wantedId" value={id} />
        <select
          name="type"
          defaultValue="SINGLE_CAR"
          className="border border-emerald-200 p-2 rounded text-sm bg-white w-full sm:w-auto"
        >
          <option value="SINGLE_CAR">単品車両</option>
          <option value="SET">セット</option>
          <option value="PART">パーツ</option>
        </select>
        <input
          type="text"
          name="price"
          placeholder="購入価格 (任意)"
          className="border border-emerald-200 p-2 rounded text-sm w-full sm:flex-1 min-w-0"
        />
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-sm font-medium whitespace-nowrap transition-colors"
        >
          購入登録
        </button>
      </form>
    </div>
  );
}

"use client";

import { handleAddWanted } from "@/app/actions/project";
import { ITEM_SCALE_OPTIONS } from "@/lib/item-scale";
import { SubmitButton } from "@/app/_components/SubmitButton";

export function AddWantedForm({ projectId }: { projectId: string }) {
  const action = handleAddWanted.bind(null, projectId);

  return (
    <form action={action} className="mb-6 flex flex-col gap-2">
      {/* 1行目: スケール + メーカー + 品名 */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        <select
          name="scale"
          className="border border-yellow-300 p-2 rounded bg-white w-full sm:w-auto"
          required
        >
          {ITEM_SCALE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="maker"
          placeholder="メーカー (例: KATO)"
          className="border border-yellow-300 p-2 rounded w-full sm:w-44"
        />
        <input
          type="text"
          name="name"
          placeholder="探している物 (例: モハ103)"
          className="border border-yellow-300 p-2 rounded w-full sm:flex-1 min-w-0"
          required
        />
      </div>

      {/* 2行目: 商品URL */}
      <input
        type="url"
        name="storeUrl"
        className="border border-yellow-300 p-2 rounded w-full"
        placeholder="商品URL"
      />

      {/* 3行目: 備考 + 追加ボタン */}
      <div className="flex flex-col sm:flex-row gap-2">
        <textarea
          name="remarks"
          placeholder="備考 (例: 旧製品を優先的に探す)"
          className="border border-yellow-300 p-2 rounded w-full sm:flex-1 min-w-0 h-24 resize-y"
        />
        <SubmitButton className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm font-medium whitespace-nowrap">追加</SubmitButton>
      </div>
    </form>
  );
}

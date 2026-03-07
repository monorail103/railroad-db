"use client";

import { handleAddWanted } from "@/app/actions/project";
import { ITEM_SCALE_OPTIONS } from "@/lib/item-scale";
import { SubmitButton } from "@/app/_components/SubmitButton";

export function AddWantedForm({ projectId }: { projectId: string }) {
  const action = handleAddWanted.bind(null, projectId);

  return (
    <form action={action} className="mb-6 bg-amber-50/50 border border-amber-200 rounded-lg p-4 space-y-3">
      {/* 1行目: スケール + メーカー */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        <select
          name="scale"
          className="border border-amber-300 bg-white p-2 rounded-lg w-full sm:w-auto text-sm"
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
          className="border border-amber-300 bg-white p-2 rounded-lg w-full sm:w-44 text-sm placeholder:text-slate-400"
        />
        
      </div>

      {/* 2行目: 商品URL + 品名 */}
        <div className="flex flex-row gap-2">
        <input
          type="url"
          name="storeUrl"
            className="border border-amber-300 bg-white p-2 rounded-lg flex-1 min-w-0 text-sm placeholder:text-slate-400"
          placeholder="商品URL"
        />
        <input
            type="text"
            name="name"
            placeholder="探している物 (例: モハ103)"
            className="border border-amber-300 bg-white p-2 rounded-lg flex-1 min-w-0 text-sm placeholder:text-slate-400"
            required
        />
      </div>

      {/* 3行目: 備考 + 追加ボタン */}
      <div className="flex flex-col sm:flex-row gap-2">
        <textarea
          name="remarks"
          placeholder="備考 (例: 旧製品を優先的に探す)"
          className="border border-amber-300 bg-white p-2 rounded-lg w-full sm:flex-1 min-w-0 h-20 resize-y text-sm placeholder:text-slate-400"
        />
        <SubmitButton className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap shadow-sm hover:shadow transition-all self-end">追加</SubmitButton>
      </div>
    </form>
  );
}

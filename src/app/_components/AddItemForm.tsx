"use client";

import { handleAddItem } from "@/app/actions/project";
import { ITEM_SCALE_OPTIONS } from "@/lib/item-scale";
import { SubmitButton } from "@/app/_components/SubmitButton";

export function AddItemForm({ projectId }: { projectId: string }) {
  const action = handleAddItem.bind(null, projectId);

  return (
    <form action={action} className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
      {/* 1行目: 種別 + スケール */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        <select name="type" className="border border-slate-300 bg-white p-2 rounded-lg w-full sm:w-auto text-sm" required>
          <option value="SINGLE_CAR">単品車両</option>
          <option value="SET">セット</option>
          <option value="PART">パーツ</option>
        </select>
        <select name="scale" className="border border-slate-300 bg-white p-2 rounded-lg w-full sm:w-auto text-sm" defaultValue="N" required>
          {ITEM_SCALE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 2行目: メーカー + 品名 */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        <input
          type="text"
          name="maker"
          placeholder="メーカー (例: KATO)"
          className="border border-slate-300 bg-white p-2 rounded-lg w-full sm:w-44 text-sm placeholder:text-slate-400"
        />
        <input
          type="text"
          name="name"
          placeholder="品名 (例: モハ102-xxx)"
          className="border border-slate-300 bg-white p-2 rounded-lg w-full sm:flex-1 min-w-0 text-sm placeholder:text-slate-400"
          required
        />
      </div>

      {/* 3行目: 備考 + 追加ボタン */}
      <div className="flex flex-col sm:flex-row gap-2">
        <textarea
          name="remarks"
          placeholder="備考 (例: 1500円以下なら即買い)"
          className="border border-slate-300 bg-white p-2 rounded-lg w-full sm:flex-1 min-w-0 h-20 resize-y text-sm placeholder:text-slate-400"
        />
        <SubmitButton className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap shadow-sm hover:shadow transition-all self-end">追加</SubmitButton>
      </div>
    </form>
  );
}

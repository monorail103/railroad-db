"use client";

import { useState } from "react";
import { SubmitButton } from "./SubmitButton";

export function MoveToUnwantedForm({
  action,
  currentRemarks,
  currentPrice,
}: {
  action: (formData: FormData) => void;
  currentRemarks: string | null;
  currentPrice: string | null;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        🗑️ 要らないリスト行きにする
      </button>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-red-800">要らないリスト行き</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ✕ 閉じる
        </button>
      </div>
      <p className="text-sm text-red-600">
        トレード用の説明を入力してから転送できます。プロジェクトから外され、トレード可として公開されます。
      </p>
      <form action={action} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">価格・希望価格</label>
          <input
            type="text"
            name="price"
            defaultValue={currentPrice ?? ""}
            placeholder="例: 2000円、応相談"
            className="border border-slate-300 bg-white p-2 rounded-lg w-full text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">備考・トレード条件</label>
          <textarea
            name="remarks"
            defaultValue={currentRemarks ?? ""}
            placeholder="例: 未走行品、箱なし、○○と交換希望 など"
            className="border border-slate-300 bg-white p-2 rounded-lg w-full h-24 resize-y text-sm"
          />
        </div>
        <SubmitButton className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all">
          要らないリストへ転送
        </SubmitButton>
      </form>
    </div>
  );
}

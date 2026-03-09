"use client";

import { useState } from "react";
import { ITEM_SCALE_OPTIONS } from "@/lib/item-scale";
import { ITEM_TYPE_OPTIONS } from "@/lib/item-type";
import { SubmitButton } from "./SubmitButton";

export function ProjectUnwantedForm({
  action,
  projectName,
}: {
  action: (formData: FormData) => void;
  projectName: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          🗑️ まるごと要らないリスト行き
        </button>
        <p className="text-xs text-slate-500 mt-1">配下のアイテム・WANTEDを全削除し、要らないリストに登録します</p>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-red-800">まるごと要らないリスト行き</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ✕ 閉じる
        </button>
      </div>
      <p className="text-sm text-red-600">
        配下のアイテム・WANTEDを全削除し、以下の内容で要らないリストに新たなアイテムとして登録します。
      </p>
      <form
        action={(formData) => {
          if (!confirm("配下のアイテム・WANTEDがすべて削除されます。よろしいですか？")) return;
          action(formData);
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">品名</label>
            <input
              type="text"
              name="name"
              defaultValue={projectName}
              placeholder="要らないリストでの品名"
              className="border border-slate-300 bg-white p-2 rounded-lg w-full text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">メーカー</label>
            <input
              type="text"
              name="maker"
              placeholder="例: KATO"
              className="border border-slate-300 bg-white p-2 rounded-lg w-full text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">種別</label>
            <select name="type" defaultValue="SET" className="border border-slate-300 bg-white p-2 rounded-lg w-full text-sm" required>
              {ITEM_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">スケール</label>
            <select name="scale" defaultValue="N" className="border border-slate-300 bg-white p-2 rounded-lg w-full text-sm" required>
              {ITEM_SCALE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">価格・希望価格</label>
          <input
            type="text"
            name="price"
            placeholder="例: 5000円、応相談"
            className="border border-slate-300 bg-white p-2 rounded-lg w-full text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">備考・トレード条件</label>
          <textarea
            name="remarks"
            placeholder="例: 一式まとめて、バラ売り不可、○○と交換希望 など"
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

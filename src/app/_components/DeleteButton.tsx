// 確認ダイアログ付き
"use client";
export function DeleteButton({ action, label }: { action: () => void; label: string }) {
  return (
    <form action={() => { if (confirm("本当に削除しますか？")) action(); }}>
      <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded text-sm">
        {label}
      </button>
    </form>
  );
}
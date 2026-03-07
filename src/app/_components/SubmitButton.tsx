// 全フォーム共通
"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className={className} {...props}>
      {pending ? "処理中…" : children}
    </button>
  );
}
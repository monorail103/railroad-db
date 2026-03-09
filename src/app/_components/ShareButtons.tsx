"use client";

import { useState } from "react";
import { IoClipboard } from "react-icons/io5";
import { RiTwitterXFill, RiLineFill, RiDiscordFill } from "react-icons/ri";

type ShareItem = {
  name: string;
  maker: string | null;
  scale: string;
  type: string;
};

export function ShareButtons({ items }: { items: ShareItem[] }) {
  const [copied, setCopied] = useState(false);

  const buildShareText = () => {
    const lines = items.map(
      (item) =>
        `・${item.name}${item.maker ? `（${item.maker}）` : ""}【${item.type} / ${item.scale}】`
    );
    return `🔄 トレード可能な車両・パーツがあります！\n\n${lines.join("\n")}\n\n#鉄道模型 #トレード #Nゲージ`;
  };

  const shareToX = () => {
    const text = buildShareText();
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareToLine = () => {
    const text = buildShareText();
    const url = `https://line.me/R/share?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const copyForDiscord = async () => {
    const text = buildShareText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        type="button"
        onClick={shareToX}
        className="flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:shadow transition-all"
      >
        <RiTwitterXFill className="w-4 h-4" />
        Xで共有
      </button>
      <button
        type="button"
        onClick={shareToLine}
        className="flex items-center justify-center gap-2 bg-[#06C755] hover:bg-[#05b04c] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:shadow transition-all"
      >
        <RiLineFill className="w-5 h-5" />
        LINEで共有
      </button>
      <button
        type="button"
        onClick={copyForDiscord}
        className="flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752c4] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:shadow transition-all"
      >
        <IoClipboard className="w-4 h-4" />
        {copied ? "コピーしました！" : "プレーンテキストをコピー"}
      </button>
    </div>
  );
}

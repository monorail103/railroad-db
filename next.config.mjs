import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts", // この後作るService Workerの元ファイル
  swDest: "public/sw.js", // 出力先
  // このプロジェクトの dev スクリプトは webpack を使うため、開発中も有効化する
  disable: false,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack(dev) で `webpack` 設定が存在するとエラーになるため明示する
  turbopack: {},
  // 他の設定があればここに入れます
};

export default withSerwist(nextConfig);
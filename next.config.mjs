import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts", // この後作るService Workerの元ファイル
  swDest: "public/sw.js", // 出力先
  // `@serwist/next` は Turbopack(dev) をサポートしないため、開発時は無効化する
  disable: process.env.NODE_ENV !== "production",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack(dev) で `webpack` 設定が存在するとエラーになるため明示する
  turbopack: {},
  // 他の設定があればここに入れます
};

export default withSerwist(nextConfig);
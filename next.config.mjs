import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts", // この後作るService Workerの元ファイル
  swDest: "public/sw.js", // 出力先
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 他の設定があればここに入れます
};

export default withSerwist(nextConfig);
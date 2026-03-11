import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { jaJP } from '@clerk/localizations';
import { AppHeader } from "@/app/_components/AppHeader";
import { PwaRegistrar } from "@/app/_components/PwaRegistrar";
import './globals.css'

const appName = "鉄道模型コレクション管理";
const appDescription = "電波が弱い場所でも WANTED を見返しやすい、鉄道模型のコレクション管理アプリ";

export const metadata: Metadata = {
  applicationName: appName,
  title: {
    default: "鉄道模型DB",
    template: "%s | 鉄道模型DB",
  },
  description: appDescription,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: appName,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider localization={jaJP}>
      <html lang="ja">
        <body>
          <PwaRegistrar />
          <AppHeader />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
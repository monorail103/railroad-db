import { ClerkProvider } from '@clerk/nextjs'
import { jaJP } from '@clerk/localizations';
import { AppHeader } from "./_components/AppHeader";
import './globals.css'

export const metadata = {
  title: "鉄道模型DB",
  description: "鉄道模型のコレクション管理・トレードアプリ",
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
          <AppHeader />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
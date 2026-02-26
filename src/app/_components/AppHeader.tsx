"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm transition-all">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link 
            href="/" 
            className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-80 transition-opacity"
          >
            鉄道模型コレクション管理
          </Link>

          <SignedIn>
            <nav className="hidden md:flex items-center gap-1">
              <Link 
                href="/friends" 
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                フレンド
              </Link>
            </nav>
          </SignedIn>
        </div>

        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 font-medium text-sm">
                ログイン
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-4">
              <div className="md:hidden">
                <Link 
                  href="/friends" 
                  className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                >
                  フレンド
                </Link>
              </div>
              <div className="h-8 w-8 rounded-full ring-2 ring-blue-100 flex items-center justify-center overflow-hidden transition-transform hover:scale-105">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-full h-full"
                    }
                  }}
                />
              </div>
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}

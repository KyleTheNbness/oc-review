import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import NotificationBell from "@/components/NotificationBell";

export const metadata: Metadata = {
  title: "Oxpedia",
  description: "Oxford College of Emory University 中国留学生测评平台",
};

export const viewport: Viewport = {
  themeColor: "#123173",
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 提前和数据库建立连接，减少首次请求的握手延迟 */}
        {supabaseUrl && <link rel="preconnect" href={supabaseUrl} crossOrigin="" />}
        {supabaseUrl && <link rel="dns-prefetch" href={supabaseUrl} />}
      </head>
      <body className="min-h-screen text-slate-900 antialiased">
        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur-md">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-sm font-bold text-gold-400 shadow-sm shadow-brand-900/20 transition group-hover:bg-brand-800">
                Ox
              </span>
              <span>
                <span className="block text-base font-semibold leading-tight tracking-tight text-slate-900">Oxpedia</span>
                <span className="block text-[11px] leading-tight text-slate-400">Oxford College 中国留学生匿名测评平台</span>
              </span>
            </Link>
            <NotificationBell />
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-6 pb-16">
          {children}
        </main>
      </body>
    </html>
  );
}

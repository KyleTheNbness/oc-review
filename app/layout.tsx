import type { Metadata } from "next";
import "./globals.css";
import NotificationBell from "@/components/NotificationBell";

export const metadata: Metadata = {
  title: "OC 测评",
  description: "Oxford College of Emory University 中国留学生测评平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-lg font-semibold tracking-tight">OC 测评</a>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="text-sm text-gray-400">Oxford College · Emory</span>
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}

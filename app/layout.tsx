import type { Metadata } from "next";
import "./index.css";

export const metadata: Metadata = {
  title: "Quản lý sinh viên",
  description:
    "Hệ thống quản lý sinh viên. Tra cứu điểm, lịch học, bài tập và thông báo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body style={{ fontFamily: "'Be Vietnam Pro', system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}

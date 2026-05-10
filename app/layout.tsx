import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./index.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

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
    <html lang="vi" className={beVietnamPro.variable} suppressHydrationWarning>
      <body
        style={{
          fontFamily: "var(--font-be-vietnam, var(--font-sans))",
        }}
      >
        {children}
      </body>
    </html>
  );
}

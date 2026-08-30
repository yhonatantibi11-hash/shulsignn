import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShulSign — מזמור לדוד",
  description: "מערכת תצוגה וניהול לבית הכנסת מזמור לדוד",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}

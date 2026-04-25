import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مجموعة بوتات الذكاء الاصطناعي",
  description: "بوتات ذكية مدعومة بـ Gemini AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}

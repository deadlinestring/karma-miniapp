import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { TelegramBridge } from "@/components/telegram-bridge";
import "./globals.css";

export const metadata: Metadata = {
  title: "KARMA — Telegram магазин ночников",
  description: "Кастомные акриловые ночники и настенные световые панели KARMA"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#050507"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="font-sans antialiased">
        <Script src="https://telegram.org/js/telegram-web-app.js?62" strategy="beforeInteractive" />
        <TelegramBridge />
        {children}
      </body>
    </html>
  );
}

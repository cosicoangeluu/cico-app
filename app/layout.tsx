import type { Metadata, Viewport } from "next";
import { Stack_Sans_Headline, Stack_Sans_Text } from "next/font/google";
import "./globals.css";

const headline = Stack_Sans_Headline({
  variable: "--font-headline",
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: false,
});

const text = Stack_Sans_Text({
  variable: "--font-text",
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: {
    default: "CICO",
    template: "%s · CICO",
  },
  description: "Record cash-in and cash-out transactions, fees and receipts.",
};

export const viewport: Viewport = {
  themeColor: "#e6e0d2",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${headline.variable} ${text.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}

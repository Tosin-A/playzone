import type { Metadata } from "next";
import { Teko, Barlow } from "next/font/google";
import { CameraProvider } from "@/lib/CameraProvider";
import "./globals.css";

const teko = Teko({
  weight: ["400", "500", "600", "700"],
  variable: "--font-teko",
  subsets: ["latin"],
});

const barlow = Barlow({
  weight: ["400", "500", "600"],
  variable: "--font-barlow",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlayZone — Ten games. One webcam. No download.",
  description:
    "Ten browser-based computer vision mini-games. Play with your webcam, share your scores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${teko.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <CameraProvider>{children}</CameraProvider>
      </body>
    </html>
  );
}

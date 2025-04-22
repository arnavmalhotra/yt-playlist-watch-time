import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YouTube Playlist Watch Time Calculator",
  description: "Calculate the total watch time, video count, and average video duration for any YouTube playlist.",
  // You can add more metadata here like icons, open graph tags etc.
  // icons: {
  //   icon: '/favicon.ico', // Example if you add a favicon later
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

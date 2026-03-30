import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import NotificationManager from "@/components/NotificationManager";
import LocalNotifications from "@/components/LocalNotifications";
import AuthGate from "@/components/AuthGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PowerCool - Sistema de Gestión",
  description: "Sistema de gestión de equipos de aire acondicionado",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PowerCool",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <NotificationManager />
        <LocalNotifications />
        <Navbar />
        <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 pb-20 md:pb-0">
          <AuthGate>{children}</AuthGate>
        </div>
      </body>
    </html>
  );
}

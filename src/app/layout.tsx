import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { StudentCredentials } from "@/components/auth/StudentCredentials";
import { I18nProvider } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gettalim — interaktiv dars o'yinlari",
  description:
    "Sinfni jamoalarga bo'lib o'ynaladigan savol-javob o'yinlari: Arqon tortish va Poyga. Istalgan fan, istalgan savollar — JSON orqali yuklanadi.",
  applicationName: "Gettalim",
  authors: [{ name: "@Gettalim" }],
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
  openGraph: {
    title: "Gettalim — interaktiv dars o'yinlari",
    description: "Arqon tortish va Poyga: bilim asosidagi jamoaviy sinf o'yinlari.",
    images: ["/logo.png"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#12233f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" data-theme="arqon">
      <body>
        <I18nProvider>
          <AuthProvider>
            {children}
            <StudentCredentials />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

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
  // Ikonkalar `src/app/` ichidagi fayllardan avtomatik olinadi:
  // favicon.ico, icon.png, apple-icon.png. Bu yerda qo'lda yozilsa, Next
  // fayllarga qo'shadigan kesh-hashi yo'qoladi va brauzer eski ikonkani
  // ko'rsatib qolaveradi — shuning uchun `icons` maydoni ataylab yo'q.
  openGraph: {
    title: "Gettalim — interaktiv dars o'yinlari",
    description: "Arqon tortish va Poyga: bilim asosidagi jamoaviy sinf o'yinlari.",
    images: ["/og.jpg"],
    type: "website",
  },
};

export const viewport: Viewport = {
  // Logo foni bilan bir xil — telefonda brauzer paneli belgi bilan qo'shilib ketadi
  themeColor: "#06101d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" data-theme="arqon">
      <head>
        {/*
          Shriftlar CSS ichidagi `@import` orqali emas, to'g'ridan-to'g'ri shu
          yerdan yuklanadi. `@import` da brauzer avval o'z CSS faylimizni
          yuklab, keyin ichidagi manzilni ko'radi va yana so'rov yuboradi —
          uch bosqichli zanjir. Sekin internetda bu matn kech chiqishiga olib
          keladi. `preconnect` esa ulanishni oldindan ochib qo'yadi.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
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

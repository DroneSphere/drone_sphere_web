import "@/app/globals.css";
import { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import Provider from "../provider";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
});

export const metadata: Metadata = {
  title: "搜索原型系统",
  description: "无人机搜索原型系统",
};

export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string };
}>) {
  return (
    <html lang={params.lang}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${notoSans.variable} font-sans`}>
        <Provider showSidebar={true}>{children}</Provider>
      </body>
    </html>
  );
}

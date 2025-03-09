import "@/app/globals.css";
import { Noto_Sans } from "next/font/google";
import Provider from "../provider";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
});

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  return (
    <html lang={params.lang}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${notoSans.variable} font-sans`}>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}

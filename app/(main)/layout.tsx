import "@/app/globals.css";
import { Metadata } from "next";
import Provider from "../provider";

export const metadata: Metadata = {
  title: "无人机集群搜索系统",
  description: "无人机集群搜索系统",
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
      <body className={``}>
        <Provider showSidebar={true}>{children}</Provider>
      </body>
    </html>
  );
}

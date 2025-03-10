import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import QueryWrapper from "./wrapper";

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
      <body>
        <main>
          <QueryWrapper>{children}</QueryWrapper>
        </main>
        <Toaster />
      </body>
    </html>
  );
}

"use client";

import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AUTH_TOKEN_KEY } from "../../lib/storage";
import Sidebar from "./sidebar";

const queryClient = new QueryClient();

export function AuthCheck({
  children,
}: Readonly<{ children: React.ReactNode; showSidebar?: boolean }>) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    console.log("token", token);

    const isDjiWebview =
      typeof window !== "undefined" &&
      window.djiBridge &&
      typeof window.djiBridge.platformVerifyLicense === "function";

    if (!token) {
      const loginUrl = isDjiWebview ? "/pilot/login" : "/login";
      router.replace(loginUrl);
    }
  }, [router]);

  return children;
}

export default function Provider({
  children,
  showSidebar = false,
}: Readonly<{
  children: React.ReactNode;
  showSidebar?: boolean;
}>) {
  return (
    <AuthCheck>
      <QueryClientProvider client={queryClient}>
        {showSidebar ? <Sidebar>{children}</Sidebar> : children}
        <Toaster />
      </QueryClientProvider>
    </AuthCheck>
  );
}

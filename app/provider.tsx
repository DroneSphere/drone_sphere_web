"use client";

import { Toaster } from "@/components/ui/toaster";
import { NavigationProvider } from "@/contexts/navigation-context";
import { UserContextProvider } from "@/contexts/user-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AUTH_TOKEN_KEY } from "../lib/storage";
import AppLayout from "./app-layout";

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

    const curRoute = window.location.pathname;
    if (!token && !curRoute.includes("/login")) {
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
    <QueryClientProvider client={queryClient}>
      <UserContextProvider>
        <NavigationProvider>
          <AuthCheck>
            {showSidebar ? (
              <UserContextProvider>
                <AppLayout>{children}</AppLayout>
              </UserContextProvider>
            ) : (
              children
            )}
            <Toaster />
          </AuthCheck>
        </NavigationProvider>
      </UserContextProvider>
    </QueryClientProvider>
  );
}

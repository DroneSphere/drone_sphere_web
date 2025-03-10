"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Create a client
const queryClient = new QueryClient({});

interface QueryWrapperProps {
  children: ReactNode;
}

export default function QueryWrapper({ children }: QueryWrapperProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

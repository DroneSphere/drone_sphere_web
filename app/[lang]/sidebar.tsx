import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavigationProvider } from "@/contexts/navigation-context";

export default function Sidebar({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NavigationProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex pt-4 pb-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
            </div>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </NavigationProvider>
  );
}

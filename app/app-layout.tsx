import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigation } from "@/contexts/navigation-context";
import { useUserContext } from "@/contexts/user-context";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { getBreadcrumbs } = useNavigation();
  const { isLoading, user } = useUserContext();

  useEffect(() => {
    if (window) {
      window._AMapSecurityConfig = {
        securityJsCode: "4ef657a379f13efbbf096baf8b08b3ed",
      };
    }
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex items-center justify-between w-full px-8 h-16 bg-sidebar shrink-0">
        <h1 className="flex-1 font-bold text-center text-2xl text-white tracking-wide drop-shadow-sm truncate">
          无人机集群协同搜索原型系统——地面站指挥软件
        </h1>

        {!isLoading && user && (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 text-white hover:bg-sidebar-accent hover:text-white rounded transition-colors"
                >
                  <Avatar className="h-8 w-8 border-2 border-white/20">
                    <AvatarImage src="" alt={user.username} />
                    <AvatarFallback className="bg-sidebar-primary text-white">
                      {user.username
                        .split(" ")
                        .map((name) => name[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.username}</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-medium border-b">
                  {user.email}
                </div>
                <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>登出</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {(isLoading || !user) && <div className="flex-1 flex justify-end" />}
      </div>
      <SidebarProvider
        id="sidebar-provider"
        className="flex-1 flex overflow-hidden"
      >
        <AppSidebar className="pt-20 h-full overflow-y-auto" />
        <SidebarInset className="w-[calc(100vw-280px)] h-full overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2 shrink-0">
            <SidebarTrigger className="-ml-1" />
            {/* 面包屑组件 */}
            <div className="flex text-sm font-medium text-slate-700 dark:text-slate-200">
              {getBreadcrumbs().map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  {item.url ? (
                    <Link
                      href={item.url}
                      className="text-slate-700 dark:text-slate-200"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <span className="text-slate-700 dark:text-slate-200">
                      {item.title}
                    </span>
                  )}
                  {index < getBreadcrumbs().length - 1 && (
                    <span className="text-slate-400 dark:text-slate-500 mr-2">
                      /
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

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

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { getBreadcrumbs } = useNavigation();
  const { isLoading, user } = useUserContext();

  return (
    <>
      <div className="flex items-center justify-between w-full px-8 h-16 bg-sidebar">
        <div className="flex-1" />
        <h1 className="flex-1 font-semibold text-center text-2xl">
          无人机集群搜索系统
        </h1>

        {!isLoading && user && (
          <div className="flex-1 flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 hover:bg-gray-100 rounded"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user.username} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
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
      <SidebarProvider id="sidebar-provider" className="overflow-x-auto">
        <AppSidebar className="pt-20" />
        <SidebarInset className="w-[calc(100vw-280px)]">
          <div className="flex items-center gap-2 px-4 py-2">
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
    </>
  );
}

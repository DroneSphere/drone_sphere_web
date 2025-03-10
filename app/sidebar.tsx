import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useNavigation } from "@/contexts/navigation-context";
import Link from "next/link";

export default function Sidebar({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { getBreadcrumbs } = useNavigation();

  return (
    <SidebarProvider>
      <AppSidebar className="pt-16" />
      <SidebarInset>
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
                  <span className="text-slate-400 dark:text-slate-500 mx-1">
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
  );
}

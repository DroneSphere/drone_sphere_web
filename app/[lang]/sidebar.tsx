import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

export default function Sidebar({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const pathnameArray = pathname.split("/").slice(2);
  const pathnameArrayFiltered = pathnameArray.filter((item) => item !== "");
  //   生成面包屑导航
  const breadcrumbArray = pathnameArrayFiltered.map((item, index) => {
    return (
      <div key={index} className="flex items-center">
        <BreadcrumbItem>
          {(() => {
            // Define the route map with titles
            const routeMap: Record<string, string> = {
              areas: "搜索区域管理",
              drones: "无人机管理",
              wayline: "航线管理",
              jobs: "搜索任务管理",
              result: "搜索结果管理",

              // Add more routes as needed
            };

            // Get the title from the route map, fallback to capitalized path segment
            const title =
              routeMap[item] || item.charAt(0).toUpperCase() + item.slice(1);

            return title;
          })()}
        </BreadcrumbItem>
        {index === pathnameArrayFiltered.length - 1 ? null : (
          <BreadcrumbSeparator className="ml-2" />
        )}
      </div>
    );
  });

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>{breadcrumbArray}</BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

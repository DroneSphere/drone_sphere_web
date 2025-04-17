"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { NavMain } from "@/components/nav-main";
import { Sidebar, SidebarContent, SidebarFooter } from "@/components/sidebar";
import { useNavigation } from "@/contexts/navigation-context";
import { routeMap } from "@/lib/route";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isActiveRoute } = useNavigation();
  const pathname = usePathname(); // 获取当前路径

  return (
    <>
      <Sidebar variant="inset" {...props}>
        <SidebarContent>
          <NavMain
            items={routeMap.navMain.map((item) => {
              // 确保 url 不为 undefined
              const itemUrl = item.url || "#";
              // 检查父导航项自身是否激活（直接访问其URL）
              const isParentSelfActive = itemUrl !== "#" ? isActiveRoute(itemUrl) && pathname === itemUrl : false;
              
              // 处理子导航项
              const processedItems = item.items?.map(subItem => ({
                ...subItem,
                // 为子导航项添加 isActive 属性，只有当其URL完全匹配当前路径时才激活
                isActive: subItem.url ? isActiveRoute(subItem.url) && pathname === subItem.url : false
              }));
              
              // 检查是否有任何子导航项被激活
              const hasActiveChild = processedItems?.some(subItem => subItem.isActive) || false;
              
              return {
                ...item,
                url: itemUrl,
                // 父导航项的selfActive属性：只有当父导航项自身URL被访问时才为true
                selfActive: isParentSelfActive,
                // 父导航项的isActive属性：当父导航项自身激活或任何子导航项激活时为true
                isActive: isParentSelfActive || hasActiveChild,
                items: processedItems
              };
            })}
          />
        </SidebarContent>
        <SidebarFooter>{/* <NavUser /> */}</SidebarFooter>
      </Sidebar>
    </>
  );
}

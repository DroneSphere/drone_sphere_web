"use client";

import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LandPlot,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react";
import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export const routeMap = {
  user: {
    name: "ThuRAY",
    email: "thuray.email@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "无人机管理",
      url: "/drones",
      icon: Bot,
      items: [],
    },
    {
      title: "搜索区域管理",
      url: "/areas",
      icon: LandPlot,
      items: [],
    },
    {
      title: "航线管理",
      url: "/wayline",
      icon: Map,
      items: [],
    },
    {
      title: "搜索任务管理",
      url: "/jobs",
      icon: SquareTerminal,
      items: [],
    },
    {
      title: "搜索结果管理",
      url: "/result",
      icon: BookOpen,
      items: [],
    },
    {
      title: "设置",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "账户",
          url: "/settings#account",
        },
        {
          title: "通用",
          url: "/settings#general",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "获取支持",
      url: "/support",
      icon: LifeBuoy,
    },
    {
      title: "反馈",
      url: "/feedback",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // eslint-disable-next-line
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">山东大学</span>
                  <span className="truncate text-xs">团队账号</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={routeMap.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
        <NavSecondary items={routeMap.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={routeMap.user} />
      </SidebarFooter>
    </Sidebar>
  );
}

"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;    // 导航项是否激活（包括因子导航激活而导致的父导航激活）
    selfActive?: boolean;  // 导航项本身是否激活（不包括因子导航激活导致的父导航激活）
    items?: {
      title: string;
      url: string;
      isActive?: boolean; // 添加子导航项的激活状态属性
    }[];
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className={cn(
              // 只有当父导航项本身被激活（不是因为子导航项激活）时才添加高亮背景
              item.selfActive ? "bg-sidebar-accent" : "",
            )}
          >
            <SidebarMenuItem>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className="hover:cursor-pointer"
                    >
                      {/* <a href={item.url}> */}
                      <div className="flex items-center">
                        <item.icon />
                        <span>{item.title}</span>
                        <div className="flex-1" />
                        <ChevronRight className="data-[state=open]:rotate-90 transition-transform duration-200" />
                      </div>
                      {/* </a> */}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton 
                            asChild 
                            isActive={subItem.isActive}
                          >
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : (
                <SidebarMenuButton asChild tooltip={item.title}>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

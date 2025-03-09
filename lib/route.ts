import {
    BookOpen,
    Bot,
    Frame,
    LandPlot,
    LifeBuoy,
    Map,
    PieChart,
    Send,
    Settings2,
    SquareTerminal,
} from "lucide-react";

export interface RouteItem {
  title: string;
  url: string;
  icon?: React.ElementType;
  items?: {
    title: string;
    url: string;
  }[];
}

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

// 创建特殊路由映射表
export const specialRouteMap: Record<string, string> = {
  creation: "创建",
};

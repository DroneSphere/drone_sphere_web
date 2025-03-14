import {
  BookOpen,
  Frame,
  LandPlot,
  Logs,
  Map,
  Monitor,
  PieChart,
  Plane,
  Router,
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
      icon: Plane,
    },
    {
      title: "网关管理",
      url: "/gateways",
      icon: Router,
    },
    {
      title: "型号管理",
      icon: Frame,
      url: "/models",
      items: [
        {
          title: "机型管理",
          url: "/models/drones",
        },
        {
          title: "网关管理",
          url: "/models/gateways",
        },
        {
          title: "负载管理",
          url: "/models/gimbals",
        },
        {
          title: "载荷管理",
          url: "/models/payloads",
        },
      ],
    },
    {
      title: "区域管理",
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
      title: "任务管理",
      url: "/jobs",
      icon: SquareTerminal,
      items: [],
    },
    {
      title: "过程监控",
      url: "/tasks",
      icon: Monitor,
      items: [],
    },
    {
      title: "结果管理",
      url: "/result",
      icon: BookOpen,
      items: [],
    },
    {
      title: "飞行日志",
      url: "/logs",
      icon: Logs,
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
    // {
    //   title: "获取支持",
    //   url: "/support",
    //   icon: LifeBuoy,
    // },
    // {
    //   title: "反馈",
    //   url: "/feedback",
    //   icon: Send,
    // },
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

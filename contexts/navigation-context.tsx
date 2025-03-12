import { RouteItem, routeMap, specialRouteMap } from "@/lib/route";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

// 定义导航上下文类型
interface NavigationContextType {
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
  isActiveRoute: (path: string) => boolean;
  getBreadcrumbs: () => { title: string; url: string }[];
  getPageTitle: () => string;
}

// 创建导航上下文
const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

// 导航上下文提供器组件
export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [currentRoute, setCurrentRoute] = useState(pathname);

  // 当路径变化时更新当前路由
  useEffect(() => {
    setCurrentRoute(pathname);
  }, [pathname]);

  // 判断是否为活动路由
  const isActiveRoute = (path: string) => {
    return pathname.includes(path);
  };

  // 获取所有导航项目的平面列表用于面包屑查找
  const getAllNavItems = () => {
    const items: RouteItem[] = [];

    // 将主导航和子项添加到平面列表
    routeMap.navMain.forEach((item) => {
      items.push(item);
      if (item.items && item.items.length) {
        item.items.forEach((subItem) => {
          items.push({
            ...subItem,
            url: subItem.url,
          });
        });
      }
    });

    // 添加次要导航
    routeMap.navSecondary.forEach((item) => {
      items.push(item);
    });

    return items;
  };

  // 获取面包屑
  const getBreadcrumbs = () => {
    // 从路径中创建段
    const segments = pathname.split("/").filter((seg) => seg);
    const breadcrumbs: { title: string; url: string }[] = [];
    console.log("segments", segments);

    // 开始构建面包屑数组
    let currentPath = "";
    const allNavItems = getAllNavItems();

    // 针对每个路径段构建面包屑
    segments.forEach((segment) => {
      currentPath += `/${segment}`;

      // 查找匹配的导航项
      const matchingItem = allNavItems.find((item) => item.url === currentPath);

      if (matchingItem) {
        console.log("matchingItem", matchingItem);
        
        // 如果找到匹配项，使用其标题
        breadcrumbs.push({
          title: matchingItem.title,
          url: matchingItem.url,
        });
      } else {
        console.log("segment", segment);
        
        // 使用特殊路由映射或将段首字母大写
        const title =
          specialRouteMap[segment] ||
          segment.charAt(0).toUpperCase() + segment.slice(1);

        breadcrumbs.push({
          title,
          url: currentPath,
        });
      }
    });
    console.log("breadcrumbs", breadcrumbs);
    

    return breadcrumbs;
  };

  // 获取当前页面标题
  const getPageTitle = () => {
    const breadcrumbs = getBreadcrumbs();
    return breadcrumbs.length > 0
      ? breadcrumbs[breadcrumbs.length - 1].title
      : "仪表盘";
  };

  return (
    <NavigationContext.Provider
      value={{
        currentRoute,
        setCurrentRoute,
        isActiveRoute,
        getBreadcrumbs,
        getPageTitle,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

// 使用导航上下文的自定义钩子
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation 必须在 NavigationProvider 内使用");
  }
  return context;
}

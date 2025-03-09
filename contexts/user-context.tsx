import { getInfo } from "@/api/user/request";
import {
    useMutation,
    useQuery,
    useQueryClient
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ReactNode, createContext, useContext } from "react";

// 定义用户信息接口
interface User {
  username: string;
  email: string;
  avatar: string;
}

// 定义工作区接口
interface Workspace {
  name: string;
  type: string; // 如"团队账号"
}
// 定义整体上下文接口
interface UserContextType {
  user: User | null;
  workspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  updateUserData: () => void;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  logout: () => Promise<void>;
}

// 创建上下文
const UserContext = createContext<UserContextType | undefined>(undefined);

// 上下文提供者组件
export function UserContextProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 使用React Query获取用户数据
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["userInfo"],
    queryFn: getInfo,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5分钟内不重新请求
    retry: 1,
  });

  // 切换工作区的mutation
  const switchWorkspaceMutation = useMutation({
    mutationFn: async (workspaceId: string) => {
      const response = await fetch(`/api/workspace/switch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workspaceId }),
      });

      if (!response.ok) {
        throw new Error("切换工作区失败");
      }

      return response.json();
    },
    onSuccess: () => {
      // 切换成功后，刷新用户信息
      queryClient.invalidateQueries({ queryKey: ["userInfo"] });
    },
  });

  // 登出mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // 如果需要调用登出API，可以取消下面代码的注释
      // const response = await fetch("/api/logout", {
      //   method: "POST",
      // });
      // if (!response.ok) {
      //   throw new Error("登出失败");
      // }
      // return response.json();
      return Promise.resolve();
    },
    onSuccess: () => {
      // 清除缓存的查询数据
      queryClient.clear();
      // 重定向到登录页面
      router.push("/login");
    },
  });

  // 切换工作区函数
  const switchWorkspace = async (workspaceId: string) => {
    await switchWorkspaceMutation.mutateAsync(workspaceId);
  };

  // 登出函数
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  // 更新用户数据函数
  const updateUserData = () => {
    refetch();
  };

  // 提供上下文值
  const contextValue: UserContextType = {
    user: data?.user || null,
    workspace: data?.workspace || null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : "未知错误") : null,
    updateUserData,
    switchWorkspace,
    logout,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

// 自定义Hook，方便使用上下文
export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserContextProvider");
  }
  return context;
}

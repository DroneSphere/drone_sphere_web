// filepath: /Users/guosurui/Projects/DroneSphere/drone_sphere_web/app/(main)/settings/users/types.ts
// 用户信息结构
export interface UserResult {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  created_time?: string;
  updated_time?: string;
}

// 工作空间信息结构
export interface WorkspaceResult {
  id: number;
  name: string;
  type: string;
}

// 登录结果结构
export interface LoginResult {
  token: string;
  user: UserResult;
  workspace: WorkspaceResult;
}

// 用户列表结果结构
export interface UserListResult {
  users: UserResult[];
  total: number;
}

// 用户注册请求结构
export interface RegisterRequest {
  username: string;
  email: string;
  avatar?: string;
  password: string;
}

// 用户登录请求结构
export interface LoginRequest {
  email: string;
  password: string;
  sn?: string; // 遥控器SN，仅Pilot端登录时需要提供
}

// 修改密码请求结构
export interface ChangePasswordRequest {
  userId: number;
  oldPassword: string;
  newPassword: string;
}

// 创建用户请求结构
export interface CreateUserRequest {
  username: string;
  email: string;
  avatar?: string;
  password: string;
}

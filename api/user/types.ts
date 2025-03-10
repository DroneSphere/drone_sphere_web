export interface LoginRequest {
  email: string;
  password: string;
  sn?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResult {
  token?: string;
  user: {
    id: number;
    username: string;
    avatar: string;
    email: string;
  };
  workspace: {
    id: number;
    name: string;
    type: string;
  };
}

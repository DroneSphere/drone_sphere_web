export interface LoginRequest {
  username: string;
  password: string;
  sn?: string;
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

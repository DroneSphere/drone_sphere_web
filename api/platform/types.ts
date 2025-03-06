export interface PlatformResult {
  platform: string;
  workspace: string;
  workspace_id: string;
  desc: string;
}

export interface ConnectionParamsResult {
  api: APIParamResult;
  thing: ThingParamResult;
  ws: WSParamResult;
}

export interface APIParamResult {
  host: string;
  token: string;
}

export interface ThingParamResult {
  host: string;
  password: string;
  username: string;
}

export interface WSParamResult {
  host: string;
  token: string;
}

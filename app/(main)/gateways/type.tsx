export interface GatewayItemResult {
  id: number;
  sn: string;
  callsign?: string;
  status: number;
  description?: string;
  user_id: number;
  username: string;
  model: {
    id: number;
    name: string;
    description?: string;
    domain: number;
    type: number;
    sub_type: number;
  };
}

export interface GatewayItemResult {
  id: number;
  sn: string;
  callsign?: string;
  status: string; // 状态已改为字符串类型，如"离线"、"在线"
  description?: string;
  product_model: string; // 新增直接的型号字符串，替代原来的model对象
  created_at: string; // 新增创建时间
  last_online_at: string; // 新增最后在线时间
}

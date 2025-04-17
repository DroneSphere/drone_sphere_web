export interface GatewayModelItemResult {
  created_time: string;
  gateway_model_description: string;
  gateway_model_domain: number;
  gateway_model_id: number;
  gateway_model_name: string;
  gateway_model_sub_type: number;
  gateway_model_type: number;
  state: number;
  updated_time: string;
}

// 创建网关型号请求参数类型
export interface CreateGatewayModelParams {
  name?: string; // 网关型号名称
  description?: string; // 网关型号描述
  domain?: number; // 领域
  type?: number; // 网关类型
  sub_type?: number; // 网关子类型
}

// 更新网关型号请求参数类型（与创建参数相同）
export type UpdateGatewayModelParams = CreateGatewayModelParams;

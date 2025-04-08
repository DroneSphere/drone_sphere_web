export interface GatewayModelItemResult {
  // gateway model 基本信息
  gateway_model_id: number;      // 网关型号ID
  gateway_model_name: string;    // 网关型号名称
  gateway_model_description?: string;  // 网关型号描述
  gateway_model_domain: number;  // 网关域
  gateway_model_type: number;    // 网关类型
  gateway_model_sub_type: number;  // 网关子类型

  // 数据状态信息
  created_time: string;   // 创建时间
  updated_time: string;   // 更新时间
  state: number;         // 状态
}

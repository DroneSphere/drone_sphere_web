// 无人机型号响应类型
export interface DroneModelItemResult {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: null | string;
  name: string;
  description: string;
  domain: number;
  type: number;
  sub_type: number;
  gateway_description: string;
  gateway_id: number;
  gateway_name: string;
  gimbals: GimbalModel[];
}

// 云台模型类型
export interface GimbalModel {
  gimbal_model_id: number;
  created_time: string;
  updated_time: string;
  state: number;
  gimbal_model_name: string;
  gimbal_model_description: string;
  gimbal_model_product: string;
  gimbal_model_domain: number;
  gimbal_model_type: number;
  gimbal_model_sub_type: number;
  gimbalindex: number;
  is_thermal_available: boolean;
}

// 创建或更新无人机型号的请求参数
export interface DroneModelCreateUpdateParams {
  name?: string;
  description?: string;
  domain?: number;
  type?: number;
  sub_type?: number;
  gateway_id?: number;
  gimbal_ids?: number[];
}

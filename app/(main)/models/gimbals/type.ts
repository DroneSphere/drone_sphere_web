export interface GimbalItemResult {
  // 基本信息
  gimbal_model_id: number;
  gimbal_model_name: string;
  gimbal_model_description?: string;
  gimbal_model_product: string;

  // 分类信息
  gimbal_model_domain: number;
  gimbal_model_type: number;
  gimbal_model_sub_type: number;
  gimbalindex: number;

  // 状态信息
  state: number;
  is_thermal_available: boolean;

  // 时间信息
  created_time: string;
  updated_time: string;
}

export interface DroneDetailResult {
  id: number;
  /**
   * 呼号
   */
  callsign?: string;
  /**
   * 领域
   */
  domain: number;
  /**
   * 是否支持RTK◊
   */
  is_rtk_available?: boolean;
  /**
   * 是否支持热成像
   */
  is_thermal_available?: boolean;
  /**
   * 产品型号
   */
  product_model: string;
  /**
   * 产品型号标识符
   */
  product_model_key: string;
  /**
   * 序列号
   */
  sn: string;
  /**
   * 在线状态
   */
  status?: string;
  /**
   * 子类型
   */
  sub_type: number;
  /**
   * 类型
   */
  type: number;
}

export interface DroneUpdateRequest {
  /**
   * 呼号
   */
  callsign?: string;
}

export interface DroneItemResult {
  id: number;
  /**
   * 无人机的序列号
   */
  sn: string;
  callsign?: string;
  /**
   * ProductModel 无人机的型号名称
   */
  product_model: string;
  /**
   * 无人机状态
   */
  status?: string;
  /**
   * IsRTKAvailable 是否支持RTK
   */
  is_rtk_available?: boolean;
  /**
   * IsThermalAvailable 是否支持热成像
   */
  is_thermal_available?: boolean;
  created_at: string;
  last_online_at: string;
}

export interface DroneState {
  sn: string;
  lat: number;
  lng: number;
  height: number;
  heading: number;
  speed: number;
  battery: number;
}

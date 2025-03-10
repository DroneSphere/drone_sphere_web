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
  callsign?: string;
  /**
   * IsRTKAvailable 是否支持RTK
   */
  is_rtk_available?: boolean;
  /**
   * IsThermalAvailable 是否支持热成像
   */
  is_thermal_available?: boolean;
  /**
   * ProductModel 无人机的型号名称
   */
  product_model: string;
  /**
   * 以下字段来自实体信息
   */
  sn: string;
  /**
   * 以上字段来自实体信息
   */
  status?: string;
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

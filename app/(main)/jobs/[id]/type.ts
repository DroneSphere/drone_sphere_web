/**
 * 任务列表返回的元素项结构
 */
export interface JobItemResult {
  /** 任务的唯一标识ID */
  id: number;
  /** 任务名称 */
  name: string;
  /** 区域名称 */
  area_name: string;
  /** 任务描述 */
  description: string;
  /** 使用的无人机列表 */
  drones: string[];
}

export interface JobSearchParams {
  name?: string;
  area?: string;
  createAtBegin?: string;
  createAtEnd?: string;
}

/**
 * 任务创建请求的接口定义
 * @interface JobCreationRequest
 * @property {string} name - 任务名称
 * @property {string} [description] - 任务描述（可选）
 * @property {number} area_id - 区域ID
 * @property {Array<{
 *   id: number;                  - 无人机ID
 *   index: number;               - 无人机索引
 *   key: string;                 - 无人机唯一键，格式：${index}-${drone_id}-${variation_index}
 *   name: string;                - 无人机名称
 *   description?: string;        - 无人机描述（可选）
 *   model?: string;              - 无人机型号（可选）
 *   color: string;               - 无人机颜色
 *   variantion: JobDroneVariation; - 无人机变体信息
 * }>} [drones] - 任务中使用的无人机列表（可选）
 * @property {Array<{
 *   droneKey: string;            - 无人机唯一键，关联到drones中的key
 *   height: number;              - 航线高度
 *   color: string;               - 航线颜色
 *   points: Array<{              - 航线点位列表
 *     lat: number;               - 纬度
 *     lng: number;               - 经度
 *   }>;
 * }>} [waylines] - 任务航线列表（可选）
 * @property {Array<{
 *   selectedDroneKey: string;    - 选定的无人机唯一键
 *   physicalDroneId: number;     - 物理无人机ID
 *   physicalDroneSN: string;     - 物理无人机序列号
 * }>} mappings - 虚拟无人机到物理无人机的映射关系
 */
export interface JobCreationRequest {
  name: string;
  description?: string;
  area_id: number;
  drones?: {
    id: number;
    index: number;
    key: string; // ${index}-${drone_id}-${variation_index}
    name: string;
    description?: string;
    model?: string;
    color: string;
    variantion: JobDroneVariation;
  }[];
  waylines?: {
    droneKey: string; // ${index}-${drone_id}-${variation_index}
    height: number;
    color: string;
    points: {
      lat: number;
      lng: number;
    }[];
  }[];
  mappings: {
    selectedDroneKey: string;
    physicalDroneId: number;
    physicalDroneSN: string;
  }[];
}

export interface JobDroneVariation {
  index: number;
  name: string;
  gimbal?: {
    id: number;
    name: string;
    description?: string;
  };
  payload?: {
    id: number;
    name: string;
    description?: string;
  };
  rtk_available: boolean;
  thermal_available: boolean;
}

export interface JobCreationResult {
  areas: {
    id: number;
    name: string;
    points: {
      lat: number;
      lng: number;
      marker?: string;
    }[];
  }[];
  drones: {
    id: number;
    name: string;
    description?: string;
    model?: string;
    variantions: JobDroneVariation[];
  }[];
}

export interface JobDetailResult {
  id: number;
  name: string;
  description: string;
  area: {
    id: number;
    name: string;
    description: string;
    points?: {
      lat: number;
      lng: number;
    }[];
  };
  drones: {
    index?: number;
    key: string; // ${index}-${drone_id}-${variation_index}
    id: number;
    name: string;
    description?: string;
    model?: string;
    color: string;
    variantion: JobDroneVariation;
  }[];
  waylines: {
    // ${index}-${drone_id}-${variation_index}
    drone_key: string;
    height: number;
    color: string;
    points: {
      lat: number;
      lng: number;
    }[];
  }[];
  mappings: {
    selected_drone_key: string;
    physical_drone_id: number;
    physical_drone_sn: string;
  }[];
}

/**
 * 任务列表返回的元素项结构
 * Structure of job items returned from job list
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

/**
 * 任务搜索参数
 * Parameters for job search
 */
export interface JobSearchParams {
  /** 任务名称 */
  name?: string;
  /** 区域 */
  area?: string;
  /** 创建开始时间 */
  createAtBegin?: string;
  /** 创建结束时间 */
  createAtEnd?: string;
}

/**
 * 任务创建请求的接口定义
 * Definition for job creation request
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
  /** 任务名称 */
  name: string;
  /** 任务描述（可选） */
  description?: string;
  /** 区域ID */
  area_id: number;
  /** 任务中使用的无人机列表（可选） */
  drones?: {
    /** 无人机ID */
    id: number;
    /** 无人机索引 */
    index: number;
    /** 无人机唯一键，格式：${index}-${drone_id}-${variation_index} */
    key: string;
    /** 无人机名称 */
    name: string;
    /** 无人机描述（可选） */
    description?: string;
    /** 无人机型号（可选） */
    model?: string;
    /** 无人机颜色 */
    color: string;
    /** 无人机变体信息 */
    variantion: JobDroneVariation;
  }[];
  /** 任务航线列表（可选） */
  waylines?: {
    /** 无人机唯一键，关联到drones中的key */
    droneKey: string;
    /** 航线高度 */
    height: number;
    /** 航线颜色 */
    color: string;
    /** 航线路径 */
    path: {
      /** 纬度 */
      lat: number;
      /** 经度 */
      lng: number;
    }[];
    /** 航线点位（可选） */
    points?: {
      /** 点位索引 */
      index: number;
      /** 纬度 */
      lat: number;
      /** 经度 */
      lng: number;
    }[];
  }[];
  /** 虚拟无人机到物理无人机的映射关系 */
  mappings: {
    /** 选定的无人机唯一键 */
    selectedDroneKey: string;
    /** 物理无人机ID */
    physicalDroneId: number;
    /** 物理无人机序列号 */
    physicalDroneSN: string;
  }[];
}

/**
 * 无人机变体信息接口
 * Drone variation information interface
 */
export interface JobDroneVariation {
  /** 变体ID */
  id: number;
  /** 变体名称 */
  name: string;
  /** 云台信息（可选） */
  gimbal?: {
    /** 云台ID */
    id: number;
    /** 云台名称 */
    name: string;
    /** 云台描述（可选） */
    description?: string;
  };
  /** 负载信息（可选） */
  payload?: {
    /** 负载ID */
    id: number;
    /** 负载名称 */
    name: string;
    /** 负载描述（可选） */
    description?: string;
  };
  /** 是否可用RTK */
  rtk_available: boolean;
  /** 是否可用热成像 */
  thermal_available: boolean;
}

/**
 * 物理无人机接口
 * Physical drone interface
 */
export interface PhysicalDrone {
  /** 无人机ID */
  id: number;
  /** 序列号 */
  sn: string;
  /** 呼号 */
  callsign: string;
  /** 型号信息 */
  model: {
    /** 型号ID */
    id: number;
    /** 型号名称 */
    name: string;
  };
  /** 云台信息（可选） */
  gimbal?: {
    /** 云台名称 */
    name: string;
  }[];
  /** 负载信息（可选） */
  payload?: {
    /** 负载名称 */
    name: string;
  }[];
}

/**
 * 任务创建结果接口
 * Job creation result interface
 */
export interface JobCreationResult {
  /** 区域列表 */
  areas: {
    /** 区域ID */
    id: number;
    /** 区域名称 */
    name: string;
    /** 区域点位 */
    points: {
      /** 纬度 */
      lat: number;
      /** 经度 */
      lng: number;
      /** 标记（可选） */
      marker?: string;
    }[];
  }[];
  /** 无人机列表 */
  drones: {
    /** 无人机ID */
    id: number;
    /** 无人机名称 */
    name: string;
    /** 无人机描述（可选） */
    description?: string;
    /** 无人机变体列表 */
    variantions: JobDroneVariation[];
  }[];
}

/**
 * 任务详情结果接口
 * Job detail result interface
 */
export interface JobDetailResult {
  /** 任务ID */
  id: number;
  /** 任务名称 */
  name: string;
  /** 任务描述 */
  description: string;
  /** 区域信息 */
  area: {
    /** 区域ID */
    id: number;
    /** 区域名称 */
    name: string;
    /** 区域描述 */
    description: string;
    /** 区域点位（可选） */
    points?: {
      /** 纬度 */
      lat: number;
      /** 经度 */
      lng: number;
    }[];
  };
  /** 无人机列表 */
  drones: {
    /** 无人机索引（可选） */
    index?: number;
    /** 无人机唯一键, 格式：${index}-${drone_id}-${variation_index} */
    key: string;
    /** 无人机ID */
    id: number;
    /** 无人机名称 */
    name: string;
    /** 无人机描述（可选） */
    description?: string;
    /** 无人机型号（可选） */
    model?: string;
    /** 无人机颜色 */
    color: string;
    /** 无人机变体信息 */
    variantion: JobDroneVariation;
  }[];
  /** 航线列表 */
  waylines: {
    /** 无人机唯一键, 格式：${index}-${drone_id}-${variation_index} */
    drone_key: string;
    /** 航线高度 */
    height: number;
    /** 航线颜色 */
    color: string;
    /** 航线路径 */
    path: {
      /** 纬度 */
      lat: number;
      /** 经度 */
      lng: number;
    }[];
    /** 航线点位 */
    points: {
      /** 点位索引 */
      index: number;
      /** 纬度 */
      lat: number;
      /** 经度 */
      lng: number;
    }[];
  }[];
  /** 映射关系列表 */
  mappings: {
    /** 选定的无人机唯一键 */
    selected_drone_key: string;
    /** 物理无人机ID */
    physical_drone_id: number;
    /** 物理无人机序列号 */
    physical_drone_sn: string;
    /** 物理无人机呼号 */
    physical_drone_callsign: string;
  }[];
}

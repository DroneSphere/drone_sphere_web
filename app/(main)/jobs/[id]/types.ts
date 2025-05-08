export interface JobCreationRequest {
  /** 任务名称（必填） */
  name: string;
  /** 任务描述（选填） */
  description?: string;
  /** 计划执行时间（格式：HH:mm:ss，24小时制）*/
  schedule_time?: string;
  /** 关联的区域ID，指定任务将在哪个区域执行 */
  area_id: number;
  /**
   * 任务中使用的无人机列表（选填）
   * 包含所有参与此任务的虚拟无人机配置信息
   */
  drones?: {
    /** 无人机在列表中的序号，用于标识顺序 */
    index: number;
    /** 无人机唯一标识键，遵循格式：${index}-${drone_id}-${variation_index} */
    key: string;
    /** 无人机型号ID，关联到无人机型号数据表 */
    model_id: number;
    /** 无人机变体ID，指定该无人机的具体配置变种 */
    variation_id: number;
    /** 无人机在地图上的显示颜色（十六进制颜色码） */
    color: string;
    physical_drone_id?: number; // 物理无人机ID
    lens_type: string; // 镜头类型
    /** 无人机起飞点位置（选填） */
    takeoff_point?: {
      /** 纬度 */
      lat: number;
      /** 经度 */
      lng: number;
      /** 高度(米) */
      altitude: number;
    };
  }[];
  /**
   * 任务航线列表（选填）
   * 定义每个无人机需要执行的飞行路径
   */
  waylines?: {
    /** 无人机唯一键，关联到drones数组中对应无人机的key */
    drone_key: string;
    /** 航线飞行高度（单位：米） */
    altitude: number;
    /** 航线在地图上的显示颜色（十六进制颜色码） */
    color: string;
    gimbal_pitch?: number; // 云台俯仰角参数，默认-90度（垂直向下）
    gimbal_zoom?: number; // 云台放大倍数参数，默认1倍
    path: {
      /** 纬度坐标（WGS84坐标系） */
      lat: number;
      /** 经度坐标（WGS84坐标系） */
      lng: number;
    }[];
    waypoints?: {
      /** 点位在航线中的索引编号 */
      index: number;
      /** 纬度坐标（WGS84坐标系） */
      lat: number;
      /** 经度坐标（WGS84坐标系） */
      lng: number;
    }[];
  }[];
  command_drones?: {
    /** 关联到selectedDrones中的无人机唯一键 */
    drone_key: string;
    /** 指挥机目标位置 */
    position: {
      /** 纬度 */
      lat: number;
      /** 经度 */
      lng: number;
      /** 高度(米) */
      altitude: number;
    };
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
export interface JobCreationOptions {
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
  /** 计划执行时间 */
  schedule_time: string;
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
    /** 无人机唯一键, 格式：${index}-${drone_id}-${variation_index} */
    key: string;
    index: number;
    /** 无人机ID */
    model_id: number;
    variation_id: number;
    physical_drone_id?: number; // 物理无人机ID
    /** 无人机型号（可选） */
    model?: string;
    /** 无人机颜色 */
    color: string;
    lens_type: string; // 镜头类型
    takeoff_point?: {
      /** 纬度 */
      lat: number;
      /** 经度 */
      lng: number;
      /** 高度(米) */
      altitude: number;
    };
  }[];
  /** 航线列表 */
  waylines: {
    /** 无人机唯一键, 格式：${index}-${drone_id}-${variation_index} */
    drone_key: string;
    /** 航线高度 */
    altitude: number;
    /** 航线颜色 */
    color: string;
    /** 云台俯仰 */
    gimbal_pitch?: number;
    /** 云台变焦 */
    gimbal_zoom?: number;
    /** 航线路径 */
    path: {
      /** 纬度 */
      lat: number;
      /** 经度 */
      lng: number;
    }[];
    /** 航线点位 */
    waypoints: {
      /** 点位索引 */
      index: number;
      /** 纬度 */
      lat: number;
      /** 经度 */
      lng: number;
    }[];
  }[];
  command_drones?: {
    drone_key: string;
    position: {
      lat: number;
      lng: number;
      altitude: number;
    };
    color: string;
  }[];
}

/**
 * 任务编辑请求接口
 * 继承自任务创建请求，添加任务ID字段
 */
export interface JobEditRequest extends JobCreationRequest {
  /** 要编辑的任务ID */
  id: number;
}

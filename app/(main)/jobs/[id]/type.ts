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

export interface SubJobResult {
  area: JobAreaResult;
  drone: JobDrone;
  index: number;
}

export interface JobAreaResult {
  name: string;
  points: Point[];
}

export interface Point {
  lat: number;
  lng: number;
  marker: string;
}

export interface JobDrone {
  model: string;
  name: string;
  sn: string;
}

export interface JobSearchParams {
  name?: string;
  area?: string;
  createAtBegin?: string;
  createAtEnd?: string;
}

export interface JobCreationRequest {
  name: string;
  description?: string;
  area_id: number;
  drones?: {
    id: number;
    name: string;
    description?: string;
    model?: string;
    color: string;
    variantion: JobDroneVariation;
  }[];
  waylines?: {
    // ${drone_id}-${variation_index}
    drone_key: string;
    height: number;
    color: string;
    points: {
      lat: number;
      lng: number;
    }[];
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

export interface JobEditionResult {
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

export interface JobModifyRequest {
  id: number;
  description?: string;
  drone_ids?: number[];
  name?: string;
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
    id: number;
    name: string;
    description?: string;
    model?: string;
    color: string;
    variantion: JobDroneVariation;
  }[];
  waylines: {
    // ${drone_id}-${variation_index}
    drone_key: string;
    height: number;
    color: string;
    points: {
      lat: number;
      lng: number;
    }[];
  }[];
}

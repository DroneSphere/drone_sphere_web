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

export interface JobCreationOptionsResult {
  areas: {
    id: number;
    name: string;
    description: string;
  }[];
}

export interface JobCreationRequest {
  area_id: number;
  description?: string;
  name: string;
}

export interface JobEditionResult {
  id: number;
  name: string;
  description: string;
  areas: {
    id: number;
    name: string;
    points: {
      lat: number;
      lng: number;
      marker: string;
    }[];
  }[];
  drones: {
    id: number;
    callsign: string;
    description?: string;
    model?: string;
    variantions: {
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
    }[];
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
  area: {
    description: string;
    id: number;
    name: string;
    points?: {
      lat: number;
      lng: number;
    }[];
  };
  description: string;
  drones?: {
    callsign: string;
    description: string;
    id: number;
    model: string;
    sn: string;
  }[];
  name?: string;
}

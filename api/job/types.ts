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
  /** 目标分类列表 */
  target_classes: string[];
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
  droneModels: {
    model: string;
    key: string;
    drones: {
      id: number;
      callsign: string;
      description: string;
      sn: string;
    }[];
  }[];
  areas: {
    id: number;
    name: string;
    description: string;
  }[];
}

export interface JobEditionResult {
  droneModel: string;
  drones: {
    id: number;
    callsign: string;
    description: string;
    sn: string;
    rtk_available: boolean;
    thermal_available: boolean;
  }[];
  area: {
    name: string;
    points: Point[];
  };
}

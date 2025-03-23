export interface Point {
  lng: number;
  lat: number;
  index?: number;
}

export interface WayPoint extends Point {
  index: number;
}

export interface Area {
  id: number;
  name?: string;
  description?: string;
  points: Point[];
}

export interface DroneModel {
  id: number;
  name: string;
  type: number;
  sub_type: number;
}

export enum DroneStatus {
  IDLE = "idle",
  BUSY = "busy",
  OFFLINE = "offline",
}

export interface RequiredDrone {
  id: number;
  key: string;
  name: string;
  description?: string;
  model: string;
  color: string;
  variantion?: string;
  index?: number;
}

export interface Wayline {
  id?: number;
  drone_key: string;
  color: string;
  path: Point[];
  points: WayPoint[];
}

export interface DroneMapping {
  selected_drone_key: string;
  physical_drone_id: number;
  physical_drone_sn: string;
}

export interface Gimbal {
  id: number;
  name: string;
  description: string;
}

export interface Payload {
  id: number;
  name: string;
  description: string;
}

export interface AvailableDrone {
  id: number;
  callsign: string;
  sn: string;
  model: DroneModel;
  status: DroneStatus;
  description?: string;
  gimbal?: Gimbal;
  payload?: Payload;
  rtk_available: boolean;
  thermal_available: boolean;
}

export interface RequiredItem {
  id: number;
  area?: {
    index: number;
    measure: string;
    points: Point[];
    color: string;
  };
  model: DroneModel;
  rtk_required: boolean;
  thermal_required: boolean;
}

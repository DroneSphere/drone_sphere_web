export interface DroneModel {
  id: number;
  name: string;
  type: number;
  sub_type: number;
}

export interface RequiredItem {
  id: number;
  area?: {
    index: number;
    measure: string;
    points: {
      lng: number;
      lat: number;
    }[];
    color: string;
  }
  model: DroneModel;
  rtk_required: boolean;
  thermal_required: boolean;
}

export enum DroneStatus {
  IDLE = 0,
  BUSY = 1,
  OFFLINE = 2,
}

export interface AvailableDrone {
  id: number;
  callsign: string;
  sn: string;
  model: DroneModel;
  status: number;
  description?: string;
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

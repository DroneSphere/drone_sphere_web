export interface DroneModel {
  id: number;
  name: string;
  type: number;
  sub_type: number;
}

export interface RequiredDrone {
  id: number;
  model: DroneModel;
  rtk_required: boolean;
  thermal_required: boolean;
}

export interface AvailableDrone {
  id: number;
  callsign: string;
  sn: string;
  model: DroneModel;
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

export interface DroneData {
  sn?: string;
  callsign?: string;
  model?: string;
  color?: string;
  key?: string;
  selected_drone_key?: string;
  physical_drone_id?: number;
  physical_drone_sn?: string;
  name?: string;
  manufacturer?: string;
  firmware?: string;
  id?: number;
  variation?: unknown;
  [key: string]: unknown;
}

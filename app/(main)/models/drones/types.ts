export interface DroneModel {
  id: number;
  name: string;
  description?: string;
  domain: number;
  type: number;
  sub_type: number;
  gateway_name: string;
  gateway_id: number;
  gateway_description?: string;
  gimbals?: {
    id: number;
    name: string;
    description?: string;
  }[];
}

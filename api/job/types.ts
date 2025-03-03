export interface JobItemResult {
  id: number;
  name: string;
  area_name: string;
  description: string;
  drones: string[];
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

export interface FlightLogItemResult {
  id: number;
  drone_id: number;
  drone_callsign: string;
  datetime: string;
  latitude: number;
  longitude: number;
  height: number;
  speed: number;
  heading: number;
  battery: number;
}

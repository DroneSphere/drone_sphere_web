import { FlightLogItemResult } from "./type";

export async function getFlightLogItems(): Promise<FlightLogItemResult[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          drone_id: 1,
          drone_callsign: "Mavic 3 行业系列（M3E 相机）",
          datetime: "2023-10-01 12:00:00",
          latitude: 30.123456,
          longitude: 120.654321,
          height: 100,
          speed: 50,
          heading: 180,
          battery: 80,
        },
        {
          id: 2,
          drone_id: 2,
          drone_callsign: "Mavic 3 行业系列（M3T 相机）",
          datetime: "2023-10-02 14:30:00",
          latitude: 30.234567,
          longitude: 120.765432,
          height: 150,
          speed: 60,
          heading: 90,
          battery: 75,
        },
        {
          id: 3,
          drone_id: 3,
          drone_callsign: "Matrice 350 RTK",
          datetime: "2023-10-03 16:45:00",
          latitude: 30.345678,
          longitude: 120.876543,
          height: 200,
          speed: 70,
          heading: 270,
          battery: 90,
        },
      ]);
    }, 500 + Math.random() * 1000);
  });
}

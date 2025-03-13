import { AvailableDrone, DroneModel, DroneStatus, RequiredItem } from "./type";

// Mock data for drone models
const mockDroneModels: DroneModel[] = [
  { id: 1, name: "Mavic 3", type: 1, sub_type: 1 },
  { id: 2, name: "Phantom 4 Pro", type: 1, sub_type: 2 },
  { id: 3, name: "Matrice 300 RTK", type: 2, sub_type: 1 },
  { id: 4, name: "Inspire 2", type: 2, sub_type: 2 },
  { id: 5, name: "Mavic Air 2", type: 1, sub_type: 3 },
];

// Mock function to get required drones
export const fetchRequiredDrones = (): Promise<RequiredItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 101,
          area: {
            index: 1,
            measure: "1000m²",
            points: [
              { lng: 117.138899, lat: 36.667827 },
              { lng: 117.139847, lat: 36.667908 },
              { lng: 117.139536, lat: 36.667208 },
            ],
            color: "#FF0000",
          },
          model: mockDroneModels[0],
          rtk_required: false,
          thermal_required: false,
        },
        {
          id: 102,
          // area: {
          //   index: 2,
          //   measure: "1000m²",
          //   points: [
          //     { lng: 116.387128, lat: 39.916927 },
          //     { lng: 116.387328, lat: 39.916527 },
          //     { lng: 116.386928, lat: 39.916527 },
          //   ],
          //   color: "#00FF00",
          // },
          model: mockDroneModels[2],
          rtk_required: true,
          thermal_required: true,
        },
        {
          id: 103,
          // area: {
          //   index: 3,
          //   measure: "1000m²",
          //   points: [
          //     { lng: 116.377128, lat: 39.916927 },
          //     { lng: 116.377328, lat: 39.916527 },
          //     { lng: 116.376928, lat: 39.916527 },
          //   ],
          //   color: "#0000FF",
          // },
          model: mockDroneModels[3],
          rtk_required: false,
          thermal_required: true,
        },
        {
          id: 104,
          // area: {
          //   index: 4,
          //   measure: "1000m²",
          //   points: [
          //     { lng: 116.367128, lat: 39.916927 },
          //     { lng: 116.367328, lat: 39.916527 },
          //     { lng: 116.366928, lat: 39.916527 },
          //   ],
          //   color: "#FFFF00",
          // },
          model: mockDroneModels[1],
          rtk_required: true,
          thermal_required: false,
        },
      ]);
    }, 300);
  });
};

// Mock function to get available drones
export const fetchAvailableDrones = (): Promise<AvailableDrone[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 201,
          callsign: "Drone-A1",
          sn: "DJI123456",
          model: mockDroneModels[0],
          status: DroneStatus.IDLE,
          description: "Standard mapping drone",
          gimbal: {
            id: 301,
            name: "3-Axis Gimbal",
            description: "Stable gimbal system",
          },
          rtk_available: false,
          thermal_available: false,
        },
        {
          id: 202,
          callsign: "Drone-B2",
          sn: "DJI789012",
          model: mockDroneModels[2],
          status: DroneStatus.IDLE,
          description: "Industrial survey drone",
          gimbal: {
            id: 302,
            name: "Enterprise Gimbal",
            description: "High precision gimbal",
          },
          payload: {
            id: 401,
            name: "Thermal Camera",
            description: "FLIR thermal sensor",
          },
          rtk_available: true,
          thermal_available: true,
        },
        {
          id: 203,
          callsign: "Drone-C3",
          sn: "DJI345678",
          model: mockDroneModels[1],
          status: DroneStatus.OFFLINE,
          description: "Photogrammetry drone",
          payload: {
            id: 402,
            name: "RTK Module",
            description: "High accuracy positioning",
          },
          rtk_available: true,
          thermal_available: false,
        },
        {
          id: 204,
          callsign: "Drone-D4",
          sn: "DJI901234",
          model: mockDroneModels[3],
          status: DroneStatus.IDLE,
          description: "Film production drone",
          gimbal: {
            id: 303,
            name: "Pro Gimbal",
            description: "Cinema grade stabilization",
          },
          payload: {
            id: 403,
            name: "Zenmuse XT2",
            description: "Thermal and visual camera",
          },
          rtk_available: false,
          thermal_available: true,
        },
        {
          id: 205,
          callsign: "Drone-E5",
          sn: "DJI567890",
          model: mockDroneModels[4],
          status: DroneStatus.BUSY,
          description: "Compact aerial drone",
          rtk_available: false,
          thermal_available: false,
        },
      ]);
    }, 500);
  });
};

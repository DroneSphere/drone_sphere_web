import { AvailableDrone, DroneModel, RequiredDrone } from "./type";

// Mock data for drone models
const mockDroneModels: DroneModel[] = [
  { id: 1, name: "Mavic 3", type: 1, sub_type: 1 },
  { id: 2, name: "Phantom 4 Pro", type: 1, sub_type: 2 },
  { id: 3, name: "Matrice 300 RTK", type: 2, sub_type: 1 },
  { id: 4, name: "Inspire 2", type: 2, sub_type: 2 },
  { id: 5, name: "Mavic Air 2", type: 1, sub_type: 3 },
];

// Mock function to get required drones
export const fetchRequiredDrones = (): Promise<RequiredDrone[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 101,
          model: mockDroneModels[0],
          rtk_required: false,
          thermal_required: false,
        },
        {
          id: 102,
          model: mockDroneModels[2],
          rtk_required: true,
          thermal_required: true,
        },
        {
          id: 103,
          model: mockDroneModels[3],
          rtk_required: false,
          thermal_required: true,
        },
        {
          id: 104,
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
          description: "Compact aerial drone",
          rtk_available: false,
          thermal_available: false,
        },
      ]);
    }, 500);
  });
};

import { DroneModel } from "./types";

export async function getAllModels(): Promise<DroneModel[]> {
  return new Promise<DroneModel[]>((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          name: "Mavic 3 行业系列（M3E 相机）",
          description: "大疆 M300 M3E 无人机",
          domain: 0,
          type: 77,
          sub_type: 0,
          gateway_name: "DJI RC Pro",
          gateway_id: 1,
        },
        {
          id: 2,
          name: "Mavic 3 行业系列（M3T 相机）",
          description: "大疆 M3T 无人机",
          domain: 0,
          type: 77,
          sub_type: 1,
          gateway_name: "DJI RC Pro",
          gateway_id: 1,
        },
        {
          id: 3,
          name: "Matrice 350 RTK",
          description: "大疆 M350 RTK 无人机",
          domain: 0,
          type: 89,
          sub_type: 0,
          gateway_name: "DJI 带屏遥控器行业版",
          gateway_id: 1,
          gimbals: [
            {
              id: 1,
              name: "H20/H20T",
              description: "大疆 H20T 云台",
            },
            {
              id: 2,
              name: "H20N",
              description: "大疆 P1 云台",
            },
            {
              id: 1,
              name: "H30/H30T",
              description: "大疆 H20T 云台",
            },
          ],
        },
        {
          id: 4,
          name: "DJI Matrice 4 系列（M4E 相机）",
          description: "大疆 M4E 无人机",
          domain: 0,
          type: 99,
          sub_type: 0,
          gateway_name: "DJI RC Plus",
          gateway_id: 1,
        },
      ]);
    }, 500 + Math.random() * 1000);
  });
}

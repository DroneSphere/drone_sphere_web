import { GimbalItemResult } from "./types";

export async function getGimbalList(): Promise<GimbalItemResult[]> {
  return new Promise<GimbalItemResult[]>((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          product: "飞行器FPV",
          name: "Matrice 350 RTK FPV",
          description: "大疆 M350 RTK FPV 云台",
          domain: 1,
          type: 39,
          sub_type: 0,
          gimbalindex: 7,
        },
        {
          id: 2,
          product: "相机",
          name: "禅思 H20",
          description: "大疆 H20 云台，位于飞行器左舷侧",
          domain: 1,
          type: 42,
          sub_type: 0,
          gimbalindex: 0,
        },
        {
          id: 3,
          product: "相机",
          name: "禅思 H20",
          description: "大疆 H20 云台，位于飞行器右舷侧",
          domain: 1,
          type: 42,
          sub_type: 0,
          gimbalindex: 1,
        },
        {
          id: 4,
          product: "相机",
          name: "禅思 H20",
          description: "大疆 H20 云台，位于飞行器上侧",
          domain: 1,
          type: 42,
          sub_type: 0,
          gimbalindex: 2,
        },
        {
          id: 5,
          product: "相机",
          name: "DJI Matrice 4E Camera",
          description: "大疆 M4E 云台",
          domain: 1,
          type: 88,
          sub_type: 0,
          gimbalindex: 0,
        },
        {
          id: 6,
          product: "机场相机",
          name: "DJI Dock 舱外相机",
          description: "大疆机场1相机",
          domain: 1,
          type: 165,
          sub_type: 0,
          gimbalindex: 7,
        },
      ]);
    }, 500 + Math.random() * 500);
  });
}

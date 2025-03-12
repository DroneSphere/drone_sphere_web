import { GatewayItemResult } from "./types";

export async function getAllGateways(): Promise<GatewayItemResult[]> {
  return new Promise<GatewayItemResult[]>((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          name: "DJI 带屏遥控器行业版",
          description: "搭配 Matrice 300 RTK",
          domain: 2,
          type: 56,
          sub_type: 0,
        },
        {
          id: 2,
          name: "DJI RC Plus",
          description: "搭配Matrice 350 RTK,Matrice 300 RTK,Matrice 30/30T",
          domain: 2,
          type: 119,
          sub_type: 0,
        },
        {
          id: 3,
          name: "DJI RC Plus 2",
          description: "搭配>DJI Matrice 4 系列",
          domain: 2,
          type: 174,
          sub_type: 0,
        },
        {
          id: 4,
          name: "DJI RC Pro 行业版",
          description: "搭配 Mavic 3 行业系列",
          domain: 2,
          type: 144,
          sub_type: 0,
        },
        {
          id: 5,
          name: "大疆机场",
          domain: 3,
          type: 1,
          sub_type: 0,
        },
        {
          id: 6,
          name: "大疆机场2",
          domain: 3,
          type: 2,
          sub_type: 0,
        },
        {
          id: 7,
          name: "大疆机场3",
          domain: 3,
          type: 3,
          sub_type: 0,
        },
      ]);
    }, 500 + Math.random() * 1000);
  });
}

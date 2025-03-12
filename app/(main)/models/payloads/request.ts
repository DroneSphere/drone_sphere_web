import { PayloadItemResult } from "./type";

export async function getPayloads(): Promise<PayloadItemResult[]> {
  return new Promise<PayloadItemResult[]>((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          name: "DJI Mavic 3 行业系列 RTK 模块",
          category: "RTK模块",
          description:
            "DJI Mavic 3 行业系列 RTK 模块适配 DJI Mavic 3 行业系列机型，结合网络 RTK 或自定义网络 RTK 服务，或通过 D-RTK 2 移动站，提供高精度厘米级位置定位功能。",
        },
        {
          id: 2,
          name: "DJI Mavic 3 行业系列喊话器",
          category: "喊话器",
          description:
            "远程传递声音，让应急搜救等任务更高效。可储存多条语音，并支持自动循环播放",
        },
      ]);
    }, 500 + Math.random() * 1000);
  });
}

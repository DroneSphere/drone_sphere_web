"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Video } from "lucide-react";
import { useState, useRef } from "react";
import Image from "next/image";
import { DroneStateV2 } from "../../jobs/[id]/job-state";
import { DroneRTState } from "../../drones/types";
import { ControlledVideoPlayer } from "@/components/video/controlled-video-player";
import { DirectionsScaleControl } from "@/components/ui/directionscale-control";
const baseRtcURL = process.env.NEXT_PUBLIC_RTC_BASE_URL
import Link from "next/link";
import { removeLocalStorage, setLocalStorage } from "@/lib/storage";

interface DroneCardListProps {
  drones?: DroneStateV2[];
  droneRTStates: Record<string, DroneRTState>;
  droneConnections: Record<string, boolean>;
}

const DroneCardList = ({
  drones,
  droneRTStates,
  droneConnections,
}: DroneCardListProps) => {
  const [videoDialog, setVideoDialog] = useState<{
    open: boolean;
    drone: DroneStateV2 | null;
  }>({
    open: false,
    drone: null,
  });

  // 添加全局操作的状态
  const [globalCommand, setGlobalCommand] = useState<string>("hover");
  // 用来获取容器的宽度发给视频组件
  const containerRef = useRef<HTMLDivElement>(null);

  const openVideoDialog = (drone: DroneStateV2) => {
    setVideoDialog({ open: true, drone });
  };

  const closeVideoDialog = () => {
    setVideoDialog({ open: false, drone: null });
  };

  const openNewControlPage = (drone: DroneStateV2) => {
    if(drone.physical_drone_sn){
      setLocalStorage(drone.physical_drone_sn,JSON.stringify(drone||null))
      setTimeout(()=>{
        removeLocalStorage("drone.physical_drone_sn")
      },120000)
      window.open(`/control?sn=${drone.physical_drone_sn}`,"_blank")
    }
  }

  // 处理全局命令发送
  const handleGlobalCommand = () => {
    // 这里实现对所有无人机发送命令的逻辑
    console.log(`向所有无人机发送命令: ${globalCommand}`);
    // TODO: 实现实际的命令发送逻辑
  };

  if (!drones) {
    return (
      <div className="flex items-center justify-center w-auto h-full">
        <span className="text-gray-500 text-xs">没有数据</span>
      </div>
    );
  }

  return (
    <>
      {/* 添加总标题和全局控制组件 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-md font-medium">无人机列表</h2>
          <div className="text-xs text-gray-500">
            共 {drones.length} 台无人机
          </div>
        </div>

        {/* 全局控制面板 */}
        <div className="bg-white rounded-sm overflow-hidden border border-gray-100 shadow-md">
          <div className="p-2 flex items-center justify-between bg-blue-50">
            <div className="font-medium text-sm">全局控制</div>
            <div className="text-xs text-blue-600">
              操作将应用于所有已连接的无人机
            </div>
          </div>

          <div className="flex items-center py-3 px-3">
            <div className="flex items-center gap-2">
              <label htmlFor="global-drone-command" className="sr-only">
                选择全局无人机命令
              </label>
              <select
                id="global-drone-command"
                className="text-xs border rounded px-2 py-1 bg-white"
                value={globalCommand}
                onChange={(e) => setGlobalCommand(e.target.value)}
                aria-label="全局无人机命令选择"
              >
                <option value="hover">悬停</option>
                <option value="takeoff">起飞</option>
                <option value="return">返航</option>
                <option value="land">降落</option>
                <option value="emergency_land">紧急降落</option>
              </select>
              <button
                className="bg-blue-600 text-white text-xs px-3 py-1 rounded"
                onClick={handleGlobalCommand}
              >
                发送给所有无人机
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 h-full overflow-y-auto">
        {drones.map((drone, index) => (
          <div
            key={index}
            className="relative bg-white rounded-sm overflow-hidden border border-gray-100 shadow-md last:mb-2"
          >
            {/* 顶部标题栏 */}
            <div className="p-2 flex items-center justify-between">
              <div className="font-medium text-sm">
                {drone.physical_drone_callsign || drone.physical_drone_sn}
              </div>
              <div
                className={`text-xs ${
                  droneConnections[drone.physical_drone_sn || ""]
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                <div className="flex flex-row items-center">
                {drone.physical_drone_sn &&
                droneConnections[drone.physical_drone_sn]
                  ? "已连接"
                  : "未连接"}
                  <button className="ml-2 bg-green-200 text-green-600 p-1 rounded-full z-10" onClick={()=>openNewControlPage(drone)}>
                    <Video className="h-3 w-3" />
                  </button>
                  </div>
              </div>
            </div>

            {/* 主要内容区 - 左右布局 */}
            <div className="flex px-2 pb-2">
              {/* 左侧视角缩略图 */}
              <div
                className="w-20 h-20 bg-gray-100 relative cursor-pointer flex-shrink-0 rounded-md overflow-hidden"
                onClick={() => openVideoDialog(drone)}
              >
                <Image
                  src="http://47.245.40.222:9000/image/WX20250421-150551%402x.png"
                  alt="无人机视角"
                  className="object-cover"
                  fill={true}
                  sizes="80px"
                  // 添加占位符效果
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiNlZWVlZWUiLz48L3N2Zz4="
                />
                <div className="absolute bottom-1 right-1 bg-black/50 text-white p-1 rounded-full z-10">
                  <Video className="h-3 w-3" />
                </div>
              </div>

              {/* 右侧信息网格 */}
              <div className="flex-grow pl-3">
                <div className="grid grid-cols-2 text-xs gap-y-1">
                  <div className="flex items-center">
                    <span className="text-gray-500 w-12">经度：</span>
                    <span>
                      {(drone.physical_drone_sn &&
                        droneRTStates[drone.physical_drone_sn]?.lng?.toFixed(
                          6
                        )) ??
                        "--"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-12">总高：</span>
                    <span>
                      {(drone.physical_drone_sn &&
                        droneRTStates[drone.physical_drone_sn]?.height?.toFixed(
                          1
                        )) ??
                        "--"}{" "}
                      米
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-12">纬度：</span>
                    <span>
                      {(drone.physical_drone_sn &&
                        droneRTStates[drone.physical_drone_sn]?.lat?.toFixed(
                          6
                        )) ??
                        "--"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-12">速度：</span>
                    <span>
                      {(drone.physical_drone_sn &&
                        droneRTStates[drone.physical_drone_sn]?.speed) ??
                        "--"}{" "}
                      米/秒
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-12">航向：</span>
                    <span>
                      {(drone.physical_drone_sn &&
                        droneRTStates[drone.physical_drone_sn]?.heading) ??
                        "--"}
                      °
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-12">电量：</span>
                    <span>
                      {(drone.physical_drone_sn &&
                        droneRTStates[drone.physical_drone_sn]?.battery) ??
                        "--"}{" "}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-2 pb-2">
              <div className="flex items-center gap-2">
                <label htmlFor={`drone-command-${index}`} className="sr-only">
                  选择无人机命令
                </label>
                <select
                  id={`drone-command-${index}`}
                  className="text-xs border rounded px-2 py-1 bg-white"
                  aria-label="无人机命令选择"
                >
                  <option value="hover">悬停</option>
                  <option value="takeoff">起飞</option>
                  <option value="return">返航</option>
                </select>
                <button className="bg-blue-600 text-white text-xs px-3 py-1 rounded">
                  发送
                </button>
                {/* <button className="bg-green-600 text-white text-xs px-1 py-1 rounded-full">
                  <Joystick className="h-4 w-4"/>
                </button> */}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 无人机视频直播对话框 */}
      <Dialog open={videoDialog.open} onOpenChange={closeVideoDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {videoDialog.drone?.physical_drone_callsign || videoDialog.drone?.physical_drone_sn } 实时视频
            </DialogTitle>
          </DialogHeader>

          <div ref={containerRef} className="w-full aspect-video bg-black rounded-md overflow-hidden">
            <div className="w-full h-full flex items-center justify-center text-white">
              <ControlledVideoPlayer videoUrl={`${baseRtcURL}/whep/?app=live&stream=${videoDialog.drone?.physical_drone_sn}`}
              width={containerRef.current?.clientWidth || 0}
              height={containerRef.current?.clientHeight || 0}
              type="webrtc"/>
              {/* <img
                src="http://47.245.40.222:9000/image/WX20250421-150551%402x.png"
                alt="无人机直播视频"
                className="w-full h-full object-cover"
              /> */}
            </div>
          </div>
                <div className="flex flex-row items-center justify-between mt-4">
          <div className="flex flex-col gap-4 text-sm mt-2">
            <div className="flex flex-col space-y-1">
              <div className="text-gray-500 text-xs">位置信息</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  经度:
                  {(videoDialog.drone?.physical_drone_sn &&
                    droneRTStates[
                      videoDialog.drone.physical_drone_sn
                    ]?.lng?.toFixed(6)) ??
                    "--"}
                </div>
                <div>
                  纬度:
                  {(videoDialog.drone?.physical_drone_sn &&
                    droneRTStates[
                      videoDialog.drone.physical_drone_sn
                    ]?.lat?.toFixed(6)) ??
                    "--"}
                </div>
              </div>
            </div>

            

            <div className="flex flex-col space-y-1">
              <div className="text-gray-500 text-xs">飞行数据</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  高度:
                  {(videoDialog.drone?.physical_drone_sn &&
                    droneRTStates[
                      videoDialog.drone.physical_drone_sn
                    ]?.height?.toFixed(1)) ??
                    "--"}
                  米
                </div>
                <div>
                  速度:
                  {(videoDialog.drone?.physical_drone_sn &&
                    droneRTStates[videoDialog.drone.physical_drone_sn]
                      ?.speed.toFixed(2)) ??
                    "--"}
                  米/秒
                </div>
                <div>
                  电量:
                  {(videoDialog.drone?.physical_drone_sn &&
                    droneRTStates[videoDialog.drone.physical_drone_sn]
                      ?.battery) ??
                    "--"}
                  %
                </div>
              </div>
            </div>
          </div>
          <DirectionsScaleControl  physicalDroneSn={videoDialog.drone?.physical_drone_sn} cameras={videoDialog.drone?.cameras}/>          

          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button className="bg-red-600 text-white px-3 py-1 text-xs rounded">
              紧急降落
            </button>
            <button className="bg-blue-600 text-white px-3 py-1 text-xs rounded">
              返航
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DroneCardList;

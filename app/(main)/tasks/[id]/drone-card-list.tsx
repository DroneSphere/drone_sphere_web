"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DirectionsScaleControl } from "@/components/ui/directionscale-control";
import { ControlledVideoPlayer } from "@/components/video/controlled-video-player";
import { setLocalStorage } from "@/lib/storage";
import { Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DroneRTState } from "../../drones/types";
import { DroneStateV2 } from "../../jobs/[id]/job-state";
const baseRtcURL = "http://47.245.40.222:1985/rtc/v1";

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
  useEffect(() => {
    console.log("I'm mounted");
    if (containerRef.current) {
      console.log("Container width: ", containerRef.current.offsetWidth);
    }
  }, []);

  const openVideoDialog = (drone: DroneStateV2) => {
    setVideoDialog({ open: true, drone });
  };

  const closeVideoDialog = () => {
    setVideoDialog({ open: false, drone: null });
  };

  const openNewControlPage = (drone: DroneStateV2) => {
    if (drone.physical_drone_sn) {
      setLocalStorage(drone.physical_drone_sn, JSON.stringify(drone || null));
      window.open(`/control?sn=${drone.physical_drone_sn}`, "_blank");
    }
  };

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
      <div className="mb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-md font-medium">无人机列表</h2>
          <div className="text-xs text-gray-500">
            共 {drones.length} 台无人机
          </div>
        </div>

        {/* 全局控制面板 */}
        <div className="bg-white rounded-sm overflow-hidden border border-gray-100 shadow-md">
          <div className="p-2 flex items-center justify-between bg-blue-50">
            <div className="font-medium text-sm">全局控制</div>
            <div className="text-xs text-blue-600 hidden sm:block">
              操作将应用于所有已连接的无人机
            </div>
          </div>

          <div className="flex items-center py-2 px-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
              <label htmlFor="global-drone-command" className="sr-only">
                选择全局无人机命令
              </label>
              <select
                id="global-drone-command"
                className="text-xs border rounded px-2 py-1 bg-white flex-1 sm:flex-initial"
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
                className="bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                onClick={handleGlobalCommand}
              >
                发送
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
        {drones.map((drone, index) => (
          <div
            key={index}
            className="relative bg-white rounded-sm overflow-hidden border border-gray-100 shadow-md last:mb-2"
          >
            {/* 顶部标题栏 */}
            <div className="p-2 flex items-center justify-between">
              <div className="font-medium text-sm truncate flex-1 mr-2">
                {drone.physical_drone_callsign || drone.physical_drone_sn}
              </div>
              <div
                className={`text-xs flex-shrink-0 ${
                  droneConnections[drone.physical_drone_sn || ""]
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                <div className="flex flex-row items-center">
                  <span className="hidden xs:block">
                    {drone.physical_drone_sn &&
                    droneConnections[drone.physical_drone_sn]
                      ? "已连接"
                      : "未连接"}
                  </span>
                  <button
                    className="ml-2 bg-green-200 text-green-600 p-1 rounded-full z-10"
                    onClick={() => openNewControlPage(drone)}
                  >
                    <Video className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* 主要内容区 - 响应式布局 */}
            <div className="flex px-2 pb-2">
              {/* 左侧视角缩略图 */}
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 relative cursor-pointer flex-shrink-0 rounded-md overflow-hidden border-2 border-dashed border-gray-300"
                onClick={() => openVideoDialog(drone)}
              >
                {/* 使用图标作为占位符 */}
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                </div>

                {/* 连接状态指示器 */}
                <div className="absolute bottom-1 right-1 bg-black/50 text-white p-1 rounded-full z-10">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      drone.physical_drone_sn &&
                      droneConnections[drone.physical_drone_sn]
                        ? "bg-green-400"
                        : "bg-red-400"
                    }`}
                  />
                </div>

                {/* 点击提示 */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                  <span className="text-xs text-gray-600 opacity-0 hover:opacity-100 transition-opacity hidden sm:block">
                    点击查看视频
                  </span>
                </div>
              </div>

              {/* 右侧信息网格 */}
              <div className="flex-grow pl-2 sm:pl-3 min-w-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 text-xs gap-y-1 gap-x-2">
                  <div className="flex items-center min-w-0">
                    <span className="text-gray-500 w-10 flex-shrink-0">经度：</span>
                    <span className="truncate">
                      {(drone.physical_drone_sn &&
                        droneRTStates[drone.physical_drone_sn]?.lng?.toFixed(
                          6
                        )) ??
                        "--"}
                    </span>
                  </div>
                  <div className="flex items-center min-w-0">
                    <span className="text-gray-500 w-10 flex-shrink-0">总高：</span>
                    <span className="truncate">
                      {(drone.physical_drone_sn &&
                        droneRTStates[drone.physical_drone_sn]?.height?.toFixed(
                          1
                        )) ??
                        "--"}{" "}
                      米
                    </span>
                  </div>
                  <div className="flex items-center min-w-0">
                    <span className="text-gray-500 w-10 flex-shrink-0">纬度：</span>
                    <span className="truncate">
                      {(drone.physical_drone_sn &&
                        droneRTStates[drone.physical_drone_sn]?.lat?.toFixed(
                          6
                        )) ??
                        "--"}
                    </span>
                  </div>
                  <div className="flex items-center min-w-0">
                    <span className="text-gray-500 w-10 flex-shrink-0">速度：</span>
                    <span className="truncate">
                      {(drone.physical_drone_sn &&
                        droneRTStates[drone.physical_drone_sn]?.speed.toFixed(
                          1
                        )) ??
                        "--"}{" "}
                      米/秒
                    </span>
                  </div>
                  <div className="flex items-center min-w-0">
                    <span className="text-gray-500 w-10 flex-shrink-0">航向：</span>
                    <span className="truncate">
                      {(drone.physical_drone_sn &&
                        droneRTStates[drone.physical_drone_sn]?.heading.toFixed(
                          2
                        )) ??
                        "--"}
                      °
                    </span>
                  </div>
                  <div className="flex items-center min-w-0">
                    <span className="text-gray-500 w-10 flex-shrink-0">电量：</span>
                    <span className="truncate">
                      {(drone.physical_drone_sn &&
                        droneRTStates[drone.physical_drone_sn]?.battery) ??
                        "--"}{" "}
                      %
                    </span>
                  </div>
                  <div className="flex items-center min-w-0 col-span-full sm:col-span-2">
                    <span className="text-gray-500 w-14 sm:w-16 flex-shrink-0">云台：</span>
                    <span className="truncate">
                      俯仰:{(drone.physical_drone_sn &&
                        droneRTStates[drone.physical_drone_sn]?.pitch?.toFixed(
                          2
                        )) ??
                        "--"}° | 航向:{(drone.physical_drone_sn &&
                        droneRTStates[drone.physical_drone_sn]?.yaw?.toFixed(
                          2
                        )) ??
                        "--"}°
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* <div className="px-2 pb-2">
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
              </div>
            </div> */}
          </div>
        ))}
      </div>

      {/* 无人机视频直播对话框 */}
      <Dialog open={videoDialog.open} onOpenChange={closeVideoDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {videoDialog.drone?.physical_drone_callsign ||
                videoDialog.drone?.physical_drone_sn}{" "}
              实时视频
            </DialogTitle>
          </DialogHeader>

          <div
            ref={containerRef}
            className="w-full aspect-video bg-black rounded-md overflow-hidden"
          >
            <div className="w-full h-full flex items-center justify-center text-white">
              <ControlledVideoPlayer
                videoUrl={`${baseRtcURL}/whep/?app=live&stream=${videoDialog.drone?.physical_drone_sn}`}
                width={containerRef.current?.clientWidth || 0}
                height={containerRef.current?.clientHeight || 0}
                type="webrtc"
              />
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
                      droneRTStates[
                        videoDialog.drone.physical_drone_sn
                      ]?.speed.toFixed(2)) ??
                      "--"}
                    米/秒
                  </div>
                  <div>
                    电量:
                    {(videoDialog.drone?.physical_drone_sn &&
                      droneRTStates[videoDialog.drone.physical_drone_sn]
                        ?.battery.toFixed(1)) ??
                      "--"}
                    %
                  </div>
                  <div>
                    云台俯仰:
                    {(videoDialog.drone?.physical_drone_sn &&
                      droneRTStates[videoDialog.drone.physical_drone_sn]
                        ?.pitch.toFixed(1)) ??
                      "--"}
                    °
                  </div>
                  <div>
                    云台航向:
                    {(videoDialog.drone?.physical_drone_sn &&
                      droneRTStates[videoDialog.drone.physical_drone_sn]
                        ?.yaw.toFixed(1)) ??
                      "--"}
                    °
                  </div>
                </div>
              </div>
            </div>
            <DirectionsScaleControl
              physicalDroneSn={videoDialog.drone?.physical_drone_sn}
              cameras={videoDialog.drone?.cameras}
            />
          </div>
          {/* <div className="flex justify-end gap-2 mt-2">
            <button className="bg-red-600 text-white px-3 py-1 text-xs rounded">
              紧急降落
            </button>
            <button className="bg-blue-600 text-white px-3 py-1 text-xs rounded">
              返航
            </button>
          </div> */}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DroneCardList;

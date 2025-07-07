"use client"
import { ControlledVideoPlayer } from "@/components/video/controlled-video-player";
import { DirectionsScaleControl } from "@/components/ui/directionscale-control";
const baseRtcURL = process.env.NEXT_PUBLIC_RTC_BASE_URL;
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DroneStateV2 } from "../jobs/[id]/job-state";
export default function DroneContolPage(){
    const containerRef = useRef<HTMLDivElement>(null);
    const [drone,setDrone] = useState<DroneStateV2 | null>(null)
    const searchParams = useSearchParams();
    useEffect(() => {
      const sn = searchParams.get("sn");
      
      if (sn) {
        const storedState = localStorage.getItem(sn);
        console.log(storedState)
        if (storedState) {
          try {
            const parsedState = JSON.parse(storedState);
            console.log(parsedState)
            if(parsedState){
                setDrone(parsedState)
            }
          } catch (e) {
            console.error('解析状态失败', e);
          }
        }
      }
  }, [searchParams]);
    return(
        <div className="flex flex-col items-center overflow-y-auto">
        <div className="w-full p-4 flex flex-col">
          <div>
            <div className="font-bold text-2xl">
              {drone?.physical_drone_callsign || drone?.physical_drone_sn } 实时视频
            </div>
          </div>
            <div className="flex flex-row flex-1">
          <div ref={containerRef} className="w-full h-full aspect-video object-contain bg-black rounded-md overflow-hidden flex-1">
            <div className="w-full max-h-[100%] flex items-center justify-center text-white">
              <ControlledVideoPlayer videoUrl={`${baseRtcURL}/whep/?app=live&stream=${drone?.physical_drone_sn}`}
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
          {/* <div className="flex flex-col gap-4 text-sm mt-2">
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
          </div> */}
          </div>
          <div className="flex flex-col">
          <DirectionsScaleControl layout="vertical" className="m-2"  physicalDroneSn={drone?.physical_drone_sn} cameras={drone?.cameras}/>          

          
          <div className="flex justify-center gap-2 mt-2 translate-y-6">
            <button className="bg-red-600 text-white px-3 py-1 text-xs rounded">
              紧急降落
            </button>
            <button className="bg-blue-600 text-white px-3 py-1 text-xs rounded">
              返航
            </button>
          </div>
          </div>
          </div>
        </div>
      </div>
    )
}


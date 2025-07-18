"use client"
import { ControlledVideoPlayer } from "@/components/video/controlled-video-player";
import { DirectionsScaleControl } from "@/components/ui/directionscale-control";
const baseRtcURL = "http://47.245.40.222:1985/rtc/v1";
import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DroneStateV2 } from "../../(main)/jobs/[id]/job-state";
import { removeLocalStorage } from "@/lib/storage";

function DroneControlContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [drone, setDrone] = useState<DroneStateV2 | null>(null);
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const sn = searchParams.get("sn");
    
    if (sn) {
      const storedState = localStorage.getItem(sn);
      console.log("数据", storedState);
      if (storedState) {
        try {
          const parsedState = JSON.parse(storedState);
          console.log(parsedState);
          if (parsedState) {
            setDrone(parsedState);
          }
        } catch (e) {
          console.error('解析状态失败', e);
        }
      }
    }
    return () => {
      if (sn) {
        removeLocalStorage(sn);
      }
    };
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center overflow-y-auto">
      <div className="w-full p-4 flex flex-col">
        <div>
          <div className="font-bold text-2xl">
            {drone?.physical_drone_callsign || drone?.physical_drone_sn} 实时视频
          </div>
        </div>
        <div className="flex flex-row flex-1">
          <div ref={containerRef} className="w-full h-full aspect-video object-contain bg-black rounded-md overflow-hidden flex-1">
            <div className="w-full max-h-[100%] flex items-center justify-center text-white">
              <ControlledVideoPlayer videoUrl={`${baseRtcURL}/whep/?app=live&stream=${drone?.physical_drone_sn}`}
                width={containerRef.current?.clientWidth || 0}
                height={containerRef.current?.clientHeight || 0}
                type="webrtc"/>
            </div>
          </div>
          <div className="flex flex-row items-center justify-between mt-4">
          </div>
          <div className="flex flex-col">
            <DirectionsScaleControl layout="vertical" className="m-2" physicalDroneSn={drone?.physical_drone_sn} cameras={drone?.cameras}/>          
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
  );
}

export default function DroneControlPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">加载中...</div>}>
      <DroneControlContent />
    </Suspense>
  );
}

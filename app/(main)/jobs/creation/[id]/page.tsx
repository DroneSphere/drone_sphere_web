"use client";

import { fetchJobEditionData, modifyJob } from "@/api/job/request";
import { JobEditionResult, JobModifyRequest } from "@/api/job/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import DroneSelectionSidebar from "./drone-selection-sidebar";

export default function Page() {
  const AMapRef = useRef<typeof AMap | null>(null);
  const mapRef = useRef<AMap.Map | null>(null);
  const path = usePathname();
  const id = parseInt(path.split("/")[4]);
  const { toast } = useToast();
  const dataQuery = useQuery({
    queryKey: ["job-creation-options"],
    queryFn: () => fetchJobEditionData(id),
  });

  const [selectedDrones, setSelectedDrones] = useState<
    JobEditionResult["drones"] | undefined
  >();

  const editionMutation = useMutation({
    mutationFn: () => {
      const req = {
        id,
        drone_ids: selectedDrones?.map((d) => d.id) || [],
      } as JobModifyRequest;
      console.log("editionMutation", req);
      return modifyJob(req);
    },
    onSuccess: () => {
      console.log("success");
      toast({
        title: "保存成功",
        description: "任务已保存",
      });
    },
  });

  // 完成数据加载后开始处理挂载地图逻辑
  useEffect(() => {
    // Skip if data is not loaded yet
    if (!dataQuery.isSuccess || !dataQuery.data?.area?.points) return;

    window._AMapSecurityConfig = {
      securityJsCode: "4ef657a379f13efbbf096baf8b08b3ed",
    };

    AMapLoader.load({
      key: "82ea7ca3d47546f079185e7ccdade9ba",
      version: "2.0",
    })
      .then((AMap) => {
        AMapRef.current = AMap;
        mapRef.current = new AMap.Map("map", {
          viewMode: "3D",
          zoom: 17,
        });

        // Add standard controls
        AMap.plugin(["AMap.ToolBar", "AMap.Scale"], function () {
          const tool = new AMap.ToolBar();
          mapRef.current?.addControl(tool);
          const scale = new AMap.Scale();
          mapRef.current?.addControl(scale);
        });

        // Draw the area polygon
        if (dataQuery.data.area && dataQuery.data.area.points) {
          const path = dataQuery.data.area.points.map(
            (point) => new AMapRef.current!.LngLat(point.lng, point.lat)
          );
          const polygon = new AMap.Polygon({
            path,
            strokeColor: "#3366FF",
            strokeWeight: 2,
            strokeOpacity: 0.8,
            fillColor: "#3366FF",
            fillOpacity: 0.3,
          });

          mapRef.current?.add(polygon);

          // Fit map bounds to the polygon
          mapRef.current?.setFitView([polygon]);
        }
      })
      .catch((e) => {
        console.log(e);
      });

    return () => {
      mapRef.current?.destroy();
    };
  }, [dataQuery.data, dataQuery.isSuccess]);

  return (
    <div className="px-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-2xl font-semibold">任务编辑</div>
        <Button className="mb-4" onClick={() => editionMutation.mutate()}>
          保存
        </Button>
      </div>
      <div className="mb-8 flex gap-4">
        <div
          id="map"
          className="min-h-[720px] h-[calc(100vh-200px)] w-full border rounded-md shadow-sm"
        />
        <div className="w-80">
          <DroneSelectionSidebar
            drones={dataQuery.data?.drones || []}
            onSelectedChange={(selected) => {
              console.log("Selected drones:", selected);
              setSelectedDrones(selected);
            }}
          />
        </div>
      </div>
    </div>
  );
}

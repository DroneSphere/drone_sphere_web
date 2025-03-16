"use client";

import { fetchJobDetail, fetchJobEditionData } from "@/api/job/request";
import { JobDetailResult } from "@/api/job/types";
import DroneSelectionPanel from "@/app/(main)/jobs/[id]/drone-selection-panel";
import TaskInfoPanel from "@/app/(main)/jobs/[id]/task-info-panel";
import WaylinePanel from "@/app/(main)/jobs/[id]/wayline-panel";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useIsCreateMode } from "@/lib/misc";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  area_id: z.number().optional(),
});

export default function Page() {
  const AMapRef = useRef<typeof AMap | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<AMap.Map | null>(null);

  // 计算工作状态
  const { isCreateMode: isCreating, idPart } = useIsCreateMode();
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => {
    console.log("当前工作状态", isCreating, isEditing);
  }, [isCreating, isEditing]);

  // 已选择的无人机
  const [selectedDrones, setSelectedDrones] = useState<
    JobDetailResult["drones"]
  >([]);

  // 生成的航线区域
  const [waylineAreas, setWaylineAreas] = useState<
    {
      droneId: number;
      name: string;
      color: string;
      path: AMap.LngLat[];
    }[]
  >([]);

  // 当前选中的搜索区域路径
  const [path, setPath] = useState<AMap.LngLat[]>([]);

  // 编辑和创建需要的参数
  const optionsQuery = useQuery({
    queryKey: ["job-creation-options"],
    queryFn: () => fetchJobEditionData(parseInt(idPart)),
    enabled: isCreating || isEditing,
  });
  useEffect(() => {
    console.log("optionsQuery", optionsQuery.data);
  }, [optionsQuery.data]);
  // 编辑或浏览时查询已有的数据
  const dataQuery = useQuery({
    queryKey: ["job-edition-data", parseInt(idPart)],
    queryFn: () => fetchJobDetail(parseInt(idPart)),
    enabled: !isCreating,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      area_id: 0,
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    console.log("onSubmit", data);
  }

  // 完成数据加载后开始处理挂载地图逻辑
  useEffect(() => {
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

        setIsMapLoaded(true);
      })
      .catch((e) => {
        console.log(e);
      });

    return () => {
      // 清除地图实例
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      // 清除AMap实例
      if (AMapRef.current) {
        AMapRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!dataQuery.isSuccess || !dataQuery.data) return;

    const { area, drones, waylines } = dataQuery.data;
    // 如果是编辑或浏览模式，设置已选择的无人机和搜索区域
    // 设置地图区域路径
    if (!area || !area.points || !AMapRef.current) {
      return;
    }
    const areaPath = area.points.map(
      (p) => new AMapRef.current!.LngLat(p.lng, p.lat)
    );
    setPath(areaPath);

    // 设置表单中的区域ID
    form.setValue("area_id", area.id);
    form.setValue("name", dataQuery.data.name || "");
    form.setValue("description", dataQuery.data.description || "");

    // 设置已选择的无人机
    // 将API返回的无人机数据转换为组件使用的格式
    const formattedDrones: JobDetailResult["drones"] = drones.map((drone) => ({
      id: drone.id,
      name: drone.name,
      description: drone.description,
      model: drone.model,
      color: drone.color,
      variantion: drone.variantion,
    }));

    setSelectedDrones(formattedDrones);

    // 设置航线
    const formattedWaylineAreas = waylines.map((wayline) => {
      return {
        droneId: 1,
        name: "",
        // height: wayline.height,
        color: wayline.color,
        path: wayline.points.map((p) => {
          return new AMapRef.current!.LngLat(p.lng, p.lat);
        }),
      };
    });
    setWaylineAreas(formattedWaylineAreas);
  }, [dataQuery.isSuccess, dataQuery.data, isMapLoaded, form]);

  // 选择区域时绘制选中的搜索区域多边形
  useEffect(() => {
    if (
      !path ||
      path.length <= 0 ||
      !isMapLoaded ||
      !AMapRef.current ||
      !mapRef.current
    )
      return;
    console.log("path", path);

    // 清除之前的多边形
    mapRef.current.clearMap();

    const polygon = new AMapRef.current.Polygon();
    polygon.setPath(path);
    polygon.setOptions({
      strokeColor: "#3366FF",
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: "#3366FF",
      fillOpacity: 0.3,
    });
    console.log("polygon", polygon);

    mapRef.current?.add(polygon);
    mapRef.current?.setFitView([polygon]);
  }, [path, isMapLoaded]);

  // 绘制无人机航线
  useEffect(() => {
    if (!waylineAreas || !isMapLoaded || !AMapRef.current || !mapRef.current)
      return;
    for (let i = 0; i < waylineAreas.length; i++) {
      const subPath = waylineAreas[i].path;
      const drone = selectedDrones[i];

      // 创建子区域多边形
      const subPolygon = new AMapRef.current.Polygon();
      subPolygon.setPath(subPath);

      subPolygon.setOptions({
        strokeColor: drone.color,
        strokeWeight: 2,
        strokeOpacity: 1,
        fillColor: drone.color,
        fillOpacity: 0.3,
      });

      // 添加无人机信息到多边形
      const droneInfo = drone.name;
      const infoWindow = new AMapRef.current.InfoWindow({
        content: `<div>${droneInfo}</div>`,
        offset: new AMapRef.current.Pixel(0, -25),
      });

      // 点击时显示信息窗口
      AMapRef.current.Event.addListener(subPolygon, "click", () => {
        if (!infoWindow || !mapRef.current) return;
        // 关闭所有信息窗口
        mapRef.current.clearInfoWindow();
        // 打开当前信息窗口
        const path = subPolygon.getPath();
        if (!path) return;

        const center = path
          .reduce(
            (acc, point) => {
              // Ensure point is a LngLat object
              if ("getLng" in point && "getLat" in point) {
                return [acc[0] + point.getLng(), acc[1] + point.getLat()];
              }
              return acc;
            },
            [0, 0]
          )
          .map((val) => val / path.length);
        infoWindow.open(mapRef.current, [center[0], center[1]]);
      });

      mapRef.current.add(subPolygon);

      // 适应视图
      mapRef.current.setFitView();
    }
  }, [waylineAreas, isMapLoaded, selectedDrones]);

  return (
    <div className="px-4 mb-4">
      <div className="flex gap-4">
        <div
          id="map"
          className="min-h-[720px] h-[calc(100vh-200px)] w-full border rounded-md shadow-sm"
        />
        <div className="w-96">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TaskInfoPanel
                isEditing={isEditing}
                isCreating={isCreating}
                form={form}
                optionsQuery={optionsQuery}
                dataQuery={dataQuery}
                setPath={setPath}
                AMapRef={AMapRef}
              />

              <DroneSelectionPanel
                selectedDrones={selectedDrones}
                setSelectedDrones={setSelectedDrones}
                isEditMode={isCreating || isEditing}
                availableDrones={optionsQuery.data?.drones || []}
              />

              <WaylinePanel
                selectedDrones={selectedDrones}
                waylineAreas={waylineAreas}
                setWaylineAreas={setWaylineAreas}
                path={path}
                AMapRef={AMapRef}
                mapRef={mapRef}
                isEditMode={isCreating || isEditing}
              />

              <div className="mt-4 flex justify-end gap-4">
                {!isEditing && !isCreating && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(true);
                    }}
                  >
                    编辑
                  </Button>
                )}
                {isEditing && !isCreating && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                    }}
                  >
                    取消编辑
                  </Button>
                )}
                {(isEditing || isCreating) && <Button size="sm">保存</Button>}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

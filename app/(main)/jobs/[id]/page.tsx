"use client";

import { fetchJobDetail, fetchJobEditionData } from "@/api/job/request";
import DroneSelectionPanel from "@/app/(main)/jobs/[id]/drone-selection-panel";
import TaskInfoPanel from "@/app/(main)/jobs/[id]/task-info-panel";
import WaylinePanel from "@/app/(main)/jobs/[id]/wayline-panel";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useIsCreateMode } from "@/lib/misc";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import * as turf from "@turf/turf";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

function dividePolygonAmongDrones(
  path: AMap.LngLat[],
  selectedDrones: any[],
  AMapRef: any
) {
  const droneCount = selectedDrones.length;
  if (droneCount === 0) {
    return;
  }

  const coordinates = path.map((p) => [p.getLng(), p.getLat()]);
  // 确保多边形是闭合的
  if (coordinates.length > 0) {
    const firstCoordinate = coordinates[0];
    const lastCoordinate = coordinates[coordinates.length - 1];
    // 检查第一个和最后一个坐标是否相同
    if (
      firstCoordinate[0] !== lastCoordinate[0] ||
      firstCoordinate[1] !== lastCoordinate[1]
    ) {
      coordinates.push(firstCoordinate); // 将第一个坐标添加到末尾
    }
  }
  const turfPolygon = turf.polygon([coordinates]);
  const totalArea = turf.area(turfPolygon);
  const targetArea = totalArea / droneCount;

  const bounds = turf.bbox(turfPolygon);
  const minLng = bounds[0];
  const maxLng = bounds[2];
  const minLat = bounds[1];
  const maxLat = bounds[3];

  const droneSubRegions = [];
  let currentMinLng = minLng;

  for (let i = 0; i < droneCount - 1; i++) {
    let lowLng = currentMinLng;
    let highLng = maxLng;
    let bestCutLng = -1;
    let minAreaDiff = Infinity;

    for (let j = 0; j < 50; j++) {
      // Binary search for longitude
      const midLng = (lowLng + highLng) / 2;
      const rectangle = turf.polygon([
        [
          [currentMinLng, minLat],
          [midLng, minLat],
          [midLng, maxLat],
          [currentMinLng, maxLat],
          [currentMinLng, minLat],
        ],
      ]);
      const intersection = turf.intersect(
        turf.featureCollection([turfPolygon, rectangle])
      );
      if (intersection) {
        const area = turf.area(intersection);
        const diff = Math.abs(area - targetArea);
        if (diff < minAreaDiff) {
          minAreaDiff = diff;
          bestCutLng = midLng;
        }
        if (area < targetArea) {
          lowLng = midLng;
        } else {
          highLng = midLng;
        }
      } else {
        highLng = midLng;
      }
    }

    let cutLng =
      bestCutLng !== -1
        ? bestCutLng
        : currentMinLng + ((maxLng - minLng) / droneCount) * (i + 1);
    const cutRectangle = turf.polygon([
      [
        [currentMinLng, minLat],
        [cutLng, minLat],
        [cutLng, maxLat],
        [currentMinLng, maxLat],
        [currentMinLng, minLat],
      ],
    ]);
    const intersection = turf.intersect(
      turf.featureCollection([turfPolygon, cutRectangle])
    );
    if (intersection && intersection.geometry.coordinates.length > 0) {
      droneSubRegions.push(
        intersection.geometry.coordinates[0].map(
          (coord: any) => new AMapRef.current.LngLat(coord[0], coord[1])
        )
      );
    }
    currentMinLng = cutLng;
  }

  const lastRectangle = turf.polygon([
    [
      [currentMinLng, minLat],
      [maxLng, minLat],
      [maxLng, maxLat],
      [currentMinLng, maxLat],
      [currentMinLng, minLat],
    ],
  ]);
  const lastIntersection = turf.intersect(
    turf.featureCollection([turfPolygon, lastRectangle])
  );
  // const lastIntersection = intersect(turfPolygon, lastRectangle);
  // // const lastIntersection = turf.intersect(turfPolygon, lastRectangle);
  if (lastIntersection && lastIntersection.geometry.coordinates.length > 0) {
    droneSubRegions.push(
      lastIntersection.geometry.coordinates[0].map(
        (coord: any) => new AMapRef.current.LngLat(coord[0], coord[1])
      )
    );
  }

  return droneSubRegions;
}

const formSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  area_id: z.number().optional(),
});

export default function Page() {
  const { toast } = useToast();
  const AMapRef = useRef<typeof AMap | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<AMap.Map | null>(null);

  // 计算工作状态
  const { isCreateMode: isCreating, idPart } = useIsCreateMode();
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => {
    console.log("当前工作状态", isCreating, isEditing);
  }, [isCreating, isEditing]);

  // 折叠状态
  const [isTaskInfoCollapsed, setIsTaskInfoCollapsed] = useState(true);
  const [isDronesCollapsed, setIsDronesCollapsed] = useState(false);
  const [isWaylinesCollapsed, setIsWaylinesCollapsed] = useState(false);

  // 已选择的无人机
  const [selectedDrones, setSelectedDrones] = useState<
    {
      id: number;
      callsign: string;
      description?: string;
      model?: string;
      color: string;
      variantion: {
        index: number;
        name: string;
        gimbal?: {
          id: number;
          name: string;
          description?: string;
        };
        payload?: {
          id: number;
          name: string;
          description?: string;
        };
        rtk_available: boolean;
        thermal_available: boolean;
      };
    }[]
  >([]);

  const [selectedDroneKey, setSelectedDroneKey] = useState<string | undefined>(
    undefined
  );

  // 生成的航线区域
  const [waylineAreas, setWaylineAreas] = useState<
    {
      droneId: number;
      callsign: string;
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

  // const editionMutation = useMutation({
  //   mutationFn: () => {
  //     const req = {
  //       id,
  //       drone_ids: selectedDrones?.map((d) => d.id) || [],
  //     } as JobModifyRequest;
  //     console.log("editionMutation", req);
  //     return modifyJob(req);
  //   },
  //   onSuccess: () => {
  //     console.log("success");
  //     toast({
  //       title: "保存成功",
  //       description: "任务已保存",
  //     });
  //   },
  // });

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
        if (isMapLoaded) return;
        AMapRef.current = AMap;
        mapRef.current = new AMap.Map("map", {
          viewMode: "3D",
          zoom: 17,
        });
        setIsMapLoaded(true);

        // Add standard controls
        AMap.plugin(["AMap.ToolBar", "AMap.Scale"], function () {
          const tool = new AMap.ToolBar();
          mapRef.current?.addControl(tool);
          const scale = new AMap.Scale();
          mapRef.current?.addControl(scale);
        });
      })
      .catch((e) => {
        console.log(e);
      });

    return () => {
      mapRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!dataQuery.isSuccess || !dataQuery.data) return;
    const { area, drones, waylines } = dataQuery.data;
    console.log("area", area);
    console.log("drones", drones);
    // 如果是编辑或浏览模式，设置已选择的无人机和搜索区域
    // 设置地图区域路径
    if (!area || !area.points || !AMapRef.current) {
      console.log("area or AMapRef is null");
      console.log("area", area);
      console.log("AMapRef", AMapRef.current);

      return;
    }
    const areaPath = area.points.map(
      (p) => new AMapRef.current!.LngLat(p.lng, p.lat)
    );
    console.log("areaPath", areaPath);

    setPath(areaPath);

    // 设置表单中的区域ID
    form.setValue("area_id", area.id);
    form.setValue("name", dataQuery.data.name || "");
    form.setValue("description", dataQuery.data.description || "");

    // 设置已选择的无人机
    // 将API返回的无人机数据转换为组件使用的格式
    const formattedDrones = drones.map((drone, index) => ({
      ...drone,
      color: drone.color || "#ffcc77",
      variantion: drone.variantion || {
        index: 0,
        name: drone.model || "默认配置",
        rtk_available: false,
        thermal_available: false,
      },
    }));

    setSelectedDrones(formattedDrones);

    // 设置航线
    const formattedWaylineAreas = waylines.map((wayline) => {
      return {
        droneId: 1,
        callsign: "",
        // height: wayline.height,
        color: wayline.color,
        path: wayline.points.map((p) => {
          return new AMapRef.current!.LngLat(p.lng, p.lat);
        }),
      };
    });
    setWaylineAreas(formattedWaylineAreas);
  }, [dataQuery.isSuccess, dataQuery.data, isMapLoaded]);

  useEffect(() => {
    console.log("path:", path);
  }, [path]);

  // 选择区域时绘制选中的搜索区域多边形
  useEffect(() => {
    if (!path || !isMapLoaded) return;
    console.log("path", path);

    // 清空已有图形
    mapRef.current?.clearMap();
    const polygon = new AMap.Polygon();
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
      const droneInfo = drone.callsign;
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
  }, [waylineAreas, isMapLoaded]);

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
                isTaskInfoCollapsed={isTaskInfoCollapsed}
                setIsTaskInfoCollapsed={setIsTaskInfoCollapsed}
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
                collapsed={isDronesCollapsed}
                setCollapsed={setIsDronesCollapsed}
              />

              <WaylinePanel
                isWaylinesCollapsed={isWaylinesCollapsed}
                setIsWaylinesCollapsed={setIsWaylinesCollapsed}
                selectedDrones={selectedDrones}
                waylineAreas={waylineAreas}
                setWaylineAreas={setWaylineAreas}
                path={path}
                AMapRef={AMapRef}
                mapRef={mapRef}
                dividePolygonAmongDrones={dividePolygonAmongDrones}
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

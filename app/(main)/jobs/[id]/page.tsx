"use client";

import DroneSelectionPanel from "@/app/(main)/jobs/[id]/drone-selection-panel";
import {
  createJob,
  getJobCreateOpytions,
  getJobDetailById,
} from "@/app/(main)/jobs/[id]/request";
import TaskInfoPanel from "@/app/(main)/jobs/[id]/task-info-panel";
import {
  JobCreationRequest,
  JobDetailResult,
} from "@/app/(main)/jobs/[id]/type";
import WaylinePanel from "@/app/(main)/jobs/[id]/wayline-panel";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useIsCreateMode } from "@/lib/misc";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import DroneModelMappingPanel, {
  DroneMapping,
} from "./drone-model-mapping-panel";

const formSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  schedule_time: z.string().optional(),
  area_id: z.number().optional(),
});

export default function Page() {
  const AMapRef = useRef<typeof AMap | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<AMap.Map | null>(null);
  // Add a ref to store active editors and info windows
  const activeEditorRef = useRef<number>(-1);
  const infoWindowsRef = useRef<AMap.InfoWindow[]>([]);
  const polygonsRef = useRef<AMap.Polygon[]>([]);
  const editorsRef = useRef<AMap.PolygonEditor[]>([]);
  // Add new ref for polylines
  const polylinesRef = useRef<AMap.Polyline[]>([]);
  // Add new ref for markers
  const markersRef = useRef<AMap.Marker[][]>([]);

  // 计算工作状态
  const { isCreateMode: isCreating, idPart } = useIsCreateMode();
  const [isEditing, setIsEditing] = useState(false);

  // 已选择的无人机
  const [selectedDrones, setSelectedDrones] = useState<
    JobDetailResult["drones"]
  >([]);

  // 生成的航线区域
  const [waylineAreas, setWaylineAreas] = useState<
    {
      droneKey: string;
      color: string;
      path: AMap.LngLat[];
      points?: AMap.LngLat[];
      visible?: boolean; // Make visible property optional
    }[]
  >([]);

  // 当前选中的搜索区域路径
  const [path, setPath] = useState<AMap.LngLat[]>([]);

  // 机型和实际无人机的映射关系
  const [droneMappings, setDroneMappings] = useState<DroneMapping[]>([]);

  useEffect(() => {
    if (!isCreating && !isEditing) return;
    // 更新无人机映射关系
    const newDroneMappings = selectedDrones.map((drone, index) => {
      return {
        selectedDroneIndex: index,
        selectedDroneKey: drone.key,
        seletedDroneId: drone.id,
        physicalDroneId: 0,
        physicalDroneSN: "",
        color: drone.color,
      };
    });
    setDroneMappings(newDroneMappings);
  }, [selectedDrones, isCreating, isEditing]);

  // 编辑和创建需要的参数
  const optionsQuery = useQuery({
    queryKey: ["job-creation-options"],
    queryFn: () => getJobCreateOpytions(parseInt(idPart)),
    enabled: isCreating || isEditing,
  });
  useEffect(() => {
    console.log("optionsQuery", optionsQuery.data);
  }, [optionsQuery.data]);
  // 编辑或浏览时查询已有的数据
  const dataQuery = useQuery({
    queryKey: ["job-edition-data", parseInt(idPart)],
    queryFn: () => getJobDetailById(parseInt(idPart)),
    enabled: !isCreating,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      schedule_time: "",
      area_id: 0,
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    console.log("onSubmit", data);
    // 处理提交数据
    if (isCreating) {
      console.log("创建模式，提交数据", data);
      console.log("选中的无人机", selectedDrones);
      console.log("航线区域", waylineAreas);
      console.log("无人机映射关系", droneMappings);
      if (!selectedDrones || selectedDrones.length <= 0) {
        toast({
          title: "操作失败",
          description: "请至少选择一台无人机",
        });
        return;
      }

      if (!waylineAreas || waylineAreas.length <= 0) {
        toast({
          title: "操作失败",
          description: "请至少选择一条航线",
        });
        return;
      }

      if (!droneMappings || droneMappings.length <= 0) {
        toast({
          title: "操作失败",
          description: "请至少选择一台实际无人机",
        });
        return;
      }

      createMutation.mutate({
        name: data.name || "",
        description: data.description,
        area_id: data.area_id || 0,
        drones: selectedDrones.map((drone) => ({
          index: drone.index || 0, // 提供默认值0，确保index始终为数字类型
          key: drone.key,
          model_id: drone.id,
          variantion_id: drone.variantion.id,
          color: drone.color,
        })),
        waylines: waylineAreas.map((wayline) => ({
          drone_key: wayline.droneKey,
          height: 0,
          color: wayline.color,
          path: wayline.path.map((p) => ({
            lat: p.getLat(),
            lng: p.getLng(),
          })),
          points: wayline.points?.map((p, idx) => ({
            index: idx,
            lat: p.getLat(),
            lng: p.getLng(),
          })),
        })),
        mappings: droneMappings.map((mapping) => ({
          selected_drone_key: mapping.selectedDroneKey,
          physical_drone_id: mapping.physicalDroneId,
          physical_drone_sn: mapping.physicalDroneSN,
        })),
      });
    } else {
      // 编辑模式
      console.log("编辑模式，提交数据", data);
    }
  }

  const createMutation = useMutation({
    mutationFn: async (data: JobCreationRequest) => {
      return await createJob(data);
    },
    onSuccess: (data) => {
      console.log("创建任务成功", data);
      toast({
        title: "操作成功",
        description: "任务创建成功",
      });
    },
    onError: (error) => {
      console.error("创建任务失败", error);
      toast({
        title: "操作失败",
        description: "任务创建失败",
      });
    },
  });

  // 完成数据加载后开始处理挂载地图逻辑
  useEffect(() => {
    window._AMapSecurityConfig = {
      securityJsCode: "4ef657a379f13efbbf096baf8b3ed",
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
    };
  }, []);

  useEffect(() => {
    if (!dataQuery.isSuccess || !dataQuery.data) return;

    const { area, drones, waylines, mappings } = dataQuery.data;
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
      key: drone.key,
      index: drone.index,
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
        droneKey: wayline.drone_key,
        color: wayline.color,
        path: wayline.path.map((p) => {
          return new AMapRef.current!.LngLat(p.lng, p.lat);
        }),
        points: wayline.points?.map((p) => {
          return new AMapRef.current!.LngLat(p.lng, p.lat);
        }),
        visible: true, // Initialize as visible
      };
    });
    setWaylineAreas(formattedWaylineAreas);

    // 设置映射关系
    const formattedMappings = mappings.map((mapping) => {
      console.log("mapping", mapping);

      return {
        selectedDroneIndex:
          Number(mapping.selected_drone_key.split("-")[0]) || 0,
        seletedDroneId: Number(mapping.selected_drone_key.split("-")[1]) || 0,
        selectedDroneKey: mapping.selected_drone_key,
        physicalDroneId: mapping.physical_drone_id,
        physicalDroneSN: mapping.physical_drone_sn,
        color:
          selectedDrones.find((dr) => dr.key === mapping.selected_drone_key)
            ?.color || "",
      };
    });
    console.log("formattedMappings", formattedMappings);

    setDroneMappings(formattedMappings);
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

    mapRef.current?.add(polygon);
    mapRef.current?.setFitView([polygon]);
  }, [path, isMapLoaded]);

  // 绘制无人机航线
  useEffect(() => {
    if (!waylineAreas || !isMapLoaded || !AMapRef.current || !mapRef.current)
      return;

    // Store current map to avoid referencing the changing state in event callbacks
    const currentMap = mapRef.current;
    const currentAMap = AMapRef.current;

    // Clear previous polygons
    currentMap.clearMap();

    // Clear previous refs
    infoWindowsRef.current = [];
    polygonsRef.current = [];
    editorsRef.current = [];
    polylinesRef.current = []; // Clear polylines ref
    markersRef.current = []; // Clear markers ref

    // Redraw search area if available
    if (path && path.length > 0) {
      const areaPolygon = new currentAMap.Polygon();
      areaPolygon.setOptions({
        path: path,
        strokeColor: "#3366FF",
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: "#3366FF",
        fillOpacity: 0.3,
      });
      currentMap.add(areaPolygon);
    }

    for (let i = 0; i < waylineAreas.length; i++) {
      const subPath = waylineAreas[i].path;
      const drone = selectedDrones[i] || {
        color: "#FF0000",
        name: "未知无人机",
      };

      // Skip if not visible
      if (!waylineAreas[i].visible) continue;

      // 创建子区域多边形
      const subPolygon = new currentAMap.Polygon();
      subPolygon.setPath(subPath);
      subPolygon.setOptions({
        strokeColor: drone.color,
        strokeWeight: 2,
        strokeOpacity: 1,
        fillColor: drone.color,
        fillOpacity: 0.3,
      });

      polygonsRef.current.push(subPolygon);
      currentMap.add(subPolygon);

      // 如果有飞行路径点，绘制为折线
      if (waylineAreas[i].points && waylineAreas[i].points!.length > 0) {
        const points = waylineAreas[i].points!;

        // 创建折线
        const polyline = new currentAMap.Polyline({
          path: points,
          strokeColor: drone.color,
          strokeWeight: 4,
          strokeOpacity: 0.9,
          strokeStyle: "solid",
          strokeDasharray: [10, 5],
          lineJoin: "round",
          lineCap: "round",
          showDir: true,
        });
        polylinesRef.current.push(polyline);
        currentMap.add(polyline);

        // 在每个转折点添加圆形标记
        const waylineMarkers: AMap.Marker[] = [];
        markersRef.current[i] = waylineMarkers;

        points.forEach((point, pointIndex) => {
          const marker = new currentAMap.Marker({
            position: point,
            offset: new currentAMap.Pixel(-8, -8), // 居中偏移
            content: `<div style="
              background-color: ${drone.color};
              width: 16px;
              height: 16px;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 0 5px rgba(0,0,0,0.3);
              display: flex;
              justify-content: center;
              align-items: center;
              color: white;
              font-size: 10px;
              font-weight: bold;
            ">${pointIndex + 1}</div>`,
          });

          // 为每个标记添加鼠标悬停信息窗口
          const markerInfo = new currentAMap.InfoWindow({
            content: `<div style="padding: 5px;">
                      <p>航点 ${pointIndex + 1}</p>
                      <p>经度: ${point.getLng().toFixed(6)}</p>
                      <p>纬度: ${point.getLat().toFixed(6)}</p>
                    </div>`,
            offset: new currentAMap.Pixel(0, -20),
          });

          currentAMap.Event.addListener(marker, "mouseover", () => {
            markerInfo.open(currentMap, [point.getLng(), point.getLat()]);
          });

          currentAMap.Event.addListener(marker, "mouseout", () => {
            markerInfo.close();
          });

          waylineMarkers.push(marker);
          currentMap.add(marker);
        });
      }

      // 创建信息窗口但不立即打开
      const infoWindow = new currentAMap.InfoWindow({
        content: `<div>${drone.name}</div>`,
        offset: new currentAMap.Pixel(0, -25),
        isCustom: false,
      });
      infoWindowsRef.current.push(infoWindow);

      // 点击时显示信息窗口和开启编辑
      const polygonIndex = i; // Capture the current index
      currentAMap.Event.addListener(subPolygon, "click", () => {
        console.log(`点击了多边形 ${polygonIndex}`);
        // Close all info windows first
        currentMap.clearInfoWindow();

        // Calculate center point and open info window
        const pathPoints = subPolygon.getPath();
        if (!pathPoints) return;

        const center = pathPoints
          .reduce(
            (acc, point) => {
              if ("getLng" in point && "getLat" in point) {
                return [acc[0] + point.getLng(), acc[1] + point.getLat()];
              }
              return acc;
            },
            [0, 0]
          )
          .map((val) => val / pathPoints.length);

        infoWindow.open(currentMap, [center[0], center[1]]);

        // Only handle editors if in edit mode
        if (isCreating || isEditing) {
          // Close previous active editor if exists
          if (
            activeEditorRef.current !== -1 &&
            editorsRef.current[activeEditorRef.current]
          ) {
            editorsRef.current[activeEditorRef.current].close();
          }

          // Open this editor
          if (editorsRef.current[polygonIndex]) {
            editorsRef.current[polygonIndex].open();
            activeEditorRef.current = polygonIndex;
          }
        }
      });

      // 创建编辑器
      if (isCreating || isEditing) {
        currentAMap.plugin(["AMap.PolygonEditor"], () => {
          const polygonEditor = new currentAMap.PolygonEditor(
            currentMap,
            subPolygon
          );
          editorsRef.current.push(polygonEditor);

          // 修复: 使用参考值来防止无限循环
          let lastUpdateTime = Date.now();
          let lastPathString = JSON.stringify(subPolygon.getPath());

          // 监听编辑结束事件，更新waylineAreas
          currentAMap.Event.addListener(polygonEditor, "end", () => {
            const newPath = subPolygon.getPath();
            if (!newPath) return;

            // 将路径转换为字符串以便比较
            const newPathString = JSON.stringify(newPath);
            // 确保路径确实发生了变化，并且两次更新间隔足够长
            const currentTime = Date.now();

            if (
              newPathString !== lastPathString &&
              currentTime - lastUpdateTime > 300
            ) {
              lastUpdateTime = currentTime;
              lastPathString = newPathString;

              // 确保newPath是LngLat[]类型
              const safeNewPath = Array.isArray(newPath)
                ? newPath
                    .flat()
                    .filter(
                      (p): p is AMap.LngLat => p instanceof currentAMap.LngLat
                    )
                : [];
              // 使用函数式更新以避免依赖于当前状态
              setWaylineAreas((prev) => {
                return prev.map((area, idx) => {
                  if (idx === polygonIndex) {
                    return { ...area, path: safeNewPath };
                  }
                  return area;
                });
              });
            } else {
              console.log("路径未发生变化或更新间隔过短");
            }
          });
        });
      }
    }

    // 适应视图
    currentMap.setFitView();

    return () => {
      console.log("清除航线区域编辑器");
      // 清除编辑器
      editorsRef.current.forEach((editor, index) => {
        if (editor) {
          console.log(`关闭编辑器 ${index}`);
          editor.close();
        }
      });
      // Clear active editor reference
      activeEditorRef.current = -1;
    };
  }, [waylineAreas, isMapLoaded, selectedDrones, path, isCreating, isEditing]);

  return (
    <div className="px-4 mb-4 h-max-screen">
      <div className="flex gap-4">
        <div
          id="map"
          className="min-h-[720px] h-[calc(100vh-200px)] w-full border rounded-md shadow-sm"
        />
        <div className="w-[460px]">
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

              <DroneModelMappingPanel
                selectedDrones={selectedDrones}
                isEditMode={isCreating || isEditing}
                droneMappings={droneMappings}
                setDroneMappings={setDroneMappings}
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

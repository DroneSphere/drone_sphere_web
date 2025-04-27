"use client";

import {
  createJob,
  getJobCreateOpytions,
  getJobDetailById,
  updateJob,
} from "./requests";
import TaskInfoPanel from "@/app/(main)/jobs/[id]/task-info-panel";
import { JobCreationRequest, JobDetailResult, JobEditRequest } from "./types";
import WaylinePanel from "@/app/(main)/jobs/[id]/wayline-panel";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useIsCreateMode } from "@/lib/misc";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import DronePanel, { DroneMapping } from "./drone-panel";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  schedule_time: z
    .string()
    .regex(
      /^\d{4}-([0][1-9]|1[0-2])-([0-2][0-9]|3[0-1])\s([01][0-9]|2[0-3]):[0-5][0-9]$/,
      "请输入有效的时间格式 (yyyy-MM-DD HH:mm)"
    )
    .optional(),
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

  const router = useRouter();

  // 计算工作状态
  const { isCreateMode: isCreating, idPart } = useIsCreateMode();
  // 默认设置为编辑模式，不再区分编辑和查看状态
  const [isEditing, setIsEditing] = useState(true);

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
      visible?: boolean;
      gimbalPitch?: number; // 云台俯仰角参数，默认-90度（垂直向下）
      gimbalZoom?: number; // 云台放大倍数参数，默认1倍
    }[]
  >([]);

  // 当前选中的搜索区域路径
  const [path, setPath] = useState<AMap.LngLat[]>([]);

  // 机型和实际无人机的映射关系
  const [droneMappings, setDroneMappings] = useState<DroneMapping[]>([]);

  // 仅在创建/编辑模式下，当selectedDrones发生有效变化时更新映射关系
  useEffect(() => {
    if (!isCreating && !isEditing) return;

    // 仅为新添加的无人机创建映射关系，保留已有的映射
    setDroneMappings((currentMappings) => {
      // 获取所有已有的映射关系的键
      const existingMappedKeys = new Set(
        currentMappings.map((mapping) => mapping.selected_drone_key)
      );

      // 处理新增的无人机
      const newMappings = selectedDrones
        .filter((drone) => !existingMappedKeys.has(drone.key))
        .map((drone) => ({
          selected_drone_key: drone.key,
          physical_drone_id: 0, // 新增无人机初始无映射
          lens_type: "visible" as const, // 默认使用可见光镜头类型，使用as const确保类型正确
        }));

      // 移除不再存在的无人机的映射
      const currentDroneKeys = new Set(
        selectedDrones.map((drone) => drone.key)
      );
      const validCurrentMappings = currentMappings.filter((mapping) =>
        currentDroneKeys.has(mapping.selected_drone_key)
      );

      // 返回合并后的映射关系：保留已有的有效映射 + 添加新的映射
      return [...validCurrentMappings, ...newMappings];
    });

    console.log("已更新无人机映射关系");
  }, [isCreating, isEditing, selectedDrones]); // 添加 selectedDrones 作为依赖

  // 编辑和创建需要的参数
  const optionsQuery = useQuery({
    queryKey: ["job-creation-options"],
    queryFn: () => getJobCreateOpytions(),
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
      name: dataQuery.data?.name || "",
      description: dataQuery.data?.description || "",
      schedule_time: dataQuery.data?.schedule_time || "",
      area_id: dataQuery.data?.area?.id || 0,
    },
  });

  // 当进入编辑模式时，将所有现有数据填充到表单中
  // 使用 useCallback 包装函数，确保引用稳定性，防止每次渲染创建新的函数引用
  // 由于默认就是编辑模式，所以这个函数会在数据加载时自动调用
  const fillFormWithExistingData = useCallback(() => {
    if (!dataQuery.data) return;

    // 设置基本信息
    form.reset({
      name: dataQuery.data.name,
      description: dataQuery.data.description,
      schedule_time: dataQuery.data.schedule_time,
      area_id: dataQuery.data.area?.id || 0,
    });

    // 注释掉这里的直接设置操作，避免循环更新
    // 这些操作已经在 dataQuery useEffect 中处理
    // setSelectedDrones(formattedDronesData);
    // setDroneMappings(formattedMappingsData);
    // setWaylineAreas(formattedWaylineAreasData);
  }, [dataQuery.data, form]); // 只依赖 dataQuery.data 和 form

  function onSubmit(data: z.infer<typeof formSchema>) {
    console.log("onSubmit", data);
    // 处理提交数据
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

    // 检查是否所有无人机都已映射到实际物理无人机
    const invalidMappings = droneMappings.filter(
      (mapping) => mapping.physical_drone_id <= 0
    );
    if (invalidMappings.length > 0) {
      toast({
        title: "操作失败",
        description: "存在未绑定物理无人机的机型，请完成所有无人机的绑定",
        variant: "destructive",
      });
      console.log("未绑定的映射关系:", invalidMappings);
      return;
    }

    console.log("selectedDrones", selectedDrones);
    console.log("droneMappings", droneMappings);
    console.log("waylineAreas", waylineAreas);

    const submitData = {
      name: data.name || "",
      description: data.description,
      area_id: data.area_id || 0,
      schedule_time: data.schedule_time,
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
          // 添加云台参数
          gimbal_pitch: wayline.gimbalPitch || -90, // 默认值 -90 度（垂直向下）
          gimbal_zoom: wayline.gimbalZoom || 1, // 默认放大倍数 1x
        })),
      })),
      mappings: droneMappings.map((mapping) => ({
        selected_drone_key: mapping.selected_drone_key,
        physical_drone_id: mapping.physical_drone_id,
        // physical_drone_sn: mapping.physical_drone_id,
      })),
    };
    console.log("submitData", submitData);

    if (isCreating) {
      createMutation.mutate(submitData);
    } else if (isEditing) {
      // 编辑模式下添加id字段
      editionMutation.mutate({
        ...submitData,
        id: parseInt(idPart),
      });
    }
  }

  const createMutation = useMutation({
    mutationFn: (data: JobCreationRequest) => {
      return createJob(data);
    },
    onSuccess: (data) => {
      if (!data || data <= 0) {
        toast({
          title: "操作失败",
          description: "任务创建失败",
        });
        return;
      }
      console.log("创建任务成功", data);
      toast({
        title: "操作成功",
        description: "任务创建成功",
      });
      // 重定向到任务详情页面
      router.replace(`/jobs/${data}`);
    },
    onError: (error) => {
      console.error("创建任务失败", error);
      toast({
        title: "操作失败",
        description: "任务创建失败",
      });
    },
  });

  const editionMutation = useMutation({
    mutationFn: (data: JobEditRequest) => {
      return updateJob(data);
    },
    onSuccess: () => {
      toast({
        title: "操作成功",
        description: "任务更新成功",
      });
      // 重置编辑状态
      setIsEditing(false);
      // 刷新数据
      dataQuery.refetch();
    },
    onError: (error) => {
      console.error("更新任务失败", error);
      toast({
        title: "操作失败",
        description: "任务更新失败",
      });
    },
  });

  // 缓存格式化后的数据
  const formattedDronesData = useMemo(() => {
    if (!dataQuery.data?.drones) return [];
    return dataQuery.data.drones.map((drone) => ({
      key: drone.key,
      index: drone.index,
      id: drone.id,
      name: drone.name,
      description: drone.description,
      model: drone.model,
      color: drone.color,
      variantion: drone.variantion,
    }));
  }, [dataQuery.data?.drones]);

  // 修复 formattedMappingsData，移除对 selectedDrones 的依赖
  const formattedMappingsData = useMemo(() => {
    if (!dataQuery.data?.mappings || !dataQuery.data?.drones) return [];

    // 使用 dataQuery.data.drones 替代 selectedDrones
    // 避免对 selectedDrones 的依赖，防止形成循环依赖
    // const mappingDrones = dataQuery.data.drones;

    return dataQuery.data.mappings.map((mapping) => ({
      // selectedDroneIndex: Number(mapping.selected_drone_key.split("-")[0]) || 0,
      // seletedDroneId: Number(mapping.selected_drone_key.split("-")[1]) || 0,
      selected_drone_key: mapping.selected_drone_key,
      physical_drone_id: mapping.physical_drone_id,
      // physicalDroneSN: mapping.physical_drone_sn,
      // color:
      //   mappingDrones.find((dr) => dr.key === mapping.selected_drone_key)
      //     ?.color || "",
      lens_type: "visible" as const, // 添加 lens_type 字段，默认为可见光类型
    }));
  }, [dataQuery.data?.mappings, dataQuery.data?.drones]); // 只依赖于 dataQuery 数据

  // 修复 formattedWaylineAreasData
  const formattedWaylineAreasData = useMemo(() => {
    if (!dataQuery.data?.waylines || !AMapRef.current) return [];
    return dataQuery.data.waylines.map((wayline) => ({
      droneKey: wayline.drone_key,
      color: wayline.color,
      path: wayline.path.map((p) => new AMapRef.current!.LngLat(p.lng, p.lat)),
      points: wayline.points?.map(
        (p) => new AMapRef.current!.LngLat(p.lng, p.lat)
      ),
      visible: true,
    }));
  }, [dataQuery.data?.waylines]);

  // 完成数据加载后开始处理挂载地图逻辑
  useEffect(() => {
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
        AMap.plugin(
          ["AMap.ToolBar", "AMap.Scale", "AMap.MapType"],
          function () {
            const mapType = new AMap.MapType({
              defaultType: 0, //使用2D
            });
            mapRef.current?.addControl(mapType);

            const tool = new AMap.ToolBar();
            mapRef.current?.addControl(tool);
            const scale = new AMap.Scale();
            mapRef.current?.addControl(scale);
          }
        );

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

  // 优化 dataQuery useEffect
  useEffect(() => {
    console.log("dataQuery useEffect 触发", {
      isSuccess: dataQuery.isSuccess,
      hasData: !!dataQuery.data,
      isMapLoaded,
    });

    if (
      !dataQuery.isSuccess ||
      !dataQuery.data ||
      !isMapLoaded ||
      !AMapRef.current
    )
      return;

    const { area } = dataQuery.data;

    // 设置地图区域路径
    if (area?.points) {
      const areaPath = area.points.map(
        (p) => new AMapRef.current!.LngLat(p.lng, p.lat)
      );
      setPath(areaPath);
    }

    // 设置表单数据 - 调用包装后的函数，而不是内联设置
    fillFormWithExistingData();

    // 单独设置状态，避免在 fillFormWithExistingData 中设置
    // 使用格式化后的数据更新状态
    setSelectedDrones(formattedDronesData);
    setDroneMappings(formattedMappingsData);
    setWaylineAreas(formattedWaylineAreasData);
  }, [
    dataQuery.isSuccess,
    dataQuery.data,
    isMapLoaded,
    AMapRef,
    fillFormWithExistingData,
    formattedDronesData,
    formattedMappingsData,
    formattedWaylineAreasData,
    // 移除不必要的依赖 form
  ]);

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

  // 优化航线区域 useEffect
  useEffect(() => {
    console.log("航线区域 useEffect 触发", {
      hasWaylineAreas: !!waylineAreas,
      waylineAreasCount: waylineAreas?.length,
      isMapLoaded,
      hasAMap: !!AMapRef.current,
      hasMap: !!mapRef.current,
    });

    if (!waylineAreas || !isMapLoaded || !AMapRef.current || !mapRef.current) {
      console.log("缺少必要数据，跳过航线区域更新");
      return;
    }

    // Store current map references
    const currentMap = mapRef.current;
    const currentAMap = AMapRef.current;

    // 清除旧的地图元素
    currentMap.clearMap();

    // 清除引用
    infoWindowsRef.current = [];
    polygonsRef.current = [];
    editorsRef.current = [];
    polylinesRef.current = [];
    markersRef.current = [];

    // 重新绘制搜索区域
    if (path && path.length > 0) {
      const areaPolygon = new currentAMap.Polygon();
      areaPolygon.setPath(path);
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

    console.log("开始绘制航线区域", waylineAreas.length);
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
      console.log("清除航线区域编辑器", {
        editorsCount: editorsRef.current.length,
        activeEditor: activeEditorRef.current,
      });
      editorsRef.current.forEach((editor) => {
        if (editor) editor.close();
      });
      activeEditorRef.current = -1;
    };
  }, [waylineAreas, isMapLoaded, path, isCreating, isEditing, selectedDrones]);

  return (
    <div className="px-4 mb-4">
      <div className="flex gap-4">
        <div
          id="map"
          className="h-[calc(100vh-132px)] w-full border rounded-md shadow-sm"
        />
        <div className="w-[460px]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* 将四个面板放入一个可滚动的 div 容器中 */}
              <div className="max-h-[calc(100vh-180px)] overflow-y-auto pl-2 pr-4 space-y-4">
                <TaskInfoPanel
                  isEditing={isEditing}
                  isCreating={isCreating}
                  form={form}
                  optionsQuery={optionsQuery}
                  dataQuery={dataQuery}
                  setPath={setPath}
                  AMapRef={AMapRef}
                />
                <Separator className="my-2" />
                {/* 使用新的合并组件替代原来分开的两个组件 */}
                <DronePanel
                  selectedDrones={selectedDrones}
                  setSelectedDrones={setSelectedDrones}
                  droneMappings={droneMappings}
                  setDroneMappings={setDroneMappings}
                  isEditMode={true}
                  availableDrones={optionsQuery.data?.drones || []}
                  waylineAreas={waylineAreas} // 仅用于显示关联航线信息
                  setWaylineAreas={setWaylineAreas} // 添加setWaylineAreas用于控制航线可见性
                />
                <Separator className="my-2" />
                <WaylinePanel
                  selectedDrones={selectedDrones}
                  waylineAreas={waylineAreas}
                  setWaylineAreas={setWaylineAreas}
                  path={path}
                  AMapRef={AMapRef}
                  mapRef={mapRef}
                  isEditMode={true}
                />
              </div>

              <div className="mt-4 flex justify-end gap-4">
                <Button
                  disabled={!isMapLoaded || createMutation.isPending}
                  className="px-4 bg-blue-400 text-gray-100 hover:bg-blue-500 flex items-center"
                  // onClick={() => {
                  //   onSubmit(form.getValues());
                  // }}
                >
                  保存
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

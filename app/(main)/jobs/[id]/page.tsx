"use client";

import { fetchJobEditionData } from "@/api/job/request";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useIsCreateMode } from "@/lib/misc";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import * as turf from "@turf/turf";
import { Plus, Trash } from "lucide-react";
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
  // TODO: 浏览或编辑时，将获取的数据传入
  // useEffect(() => {
  //   console.log("selectedDrones", selectedDrones);
  // }, [selectedDrones]);

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
    queryFn: () => fetchJobEditionData(parseInt(idPart)),
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
    // Skip if data is not loaded yet
    // if (!query.isSuccess || !query.data?.areas?.length) return;

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
      })
      .catch((e) => {
        console.log(e);
      });

    return () => {
      mapRef.current?.destroy();
    };
  }, []);
  // }, [query.data, query.isSuccess]);

  // 选择区域时绘制选中的搜索区域多边形
  useEffect(() => {
    if (!path || !AMapRef.current) return;

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
  }, [path]); // 直接依赖path状态值，每次变化都会触发

  return (
    <div className="px-4 mb-4">
      <div className="flex gap-4">
        <div
          id="map"
          className="min-h-[720px] h-[calc(100vh-200px)] w-full border rounded-md shadow-sm"
        />
        <div className="w-96 space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2 p-3 border rounded-md shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-md font-medium">任务信息</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsTaskInfoCollapsed(!isTaskInfoCollapsed);
                    }}
                  >
                    {isTaskInfoCollapsed ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    )}
                  </Button>
                </div>
                {!isTaskInfoCollapsed && (
                  <>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>任务名称</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入任务名称" {...field} />
                          </FormControl>
                          <FormDescription>
                            该名称将用于对任务进行标识和说明，可以是任何信息。
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>任务描述</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入任务描述" {...field} />
                          </FormControl>
                          <FormDescription>
                            描述用于对该任务进行标识和说明，可以是任何信息。
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="area_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>区域</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(parseInt(value));
                                // 设置当前区域路径
                                setPath(
                                  optionsQuery.data?.areas
                                    .find((e) => e.id === parseInt(value))
                                    ?.points.map((p) => {
                                      return new AMapRef.current!.LngLat(
                                        p.lng,
                                        p.lat
                                      );
                                    }) || []
                                );
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="请选择区域" />
                              </SelectTrigger>
                              <SelectContent>
                                {optionsQuery.data?.areas.map((e) => (
                                  <SelectItem
                                    key={e.id}
                                    value={e.id.toString()}
                                  >
                                    {e.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              <div className="mt-4 space-y-2 p-3 border rounded-md shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-md font-medium">执飞机型</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsDronesCollapsed(!isDronesCollapsed);
                    }}
                  >
                    {isDronesCollapsed ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    )}
                  </Button>
                </div>
                {!isDronesCollapsed && (
                  <>
                    {/* 一条用来创建的按钮 */}
                    <div className="flex justify-between items-center">
                      <FormItem className="flex-1 mr-4">
                        <Select
                          onValueChange={(value) => {
                            setSelectedDroneKey(value);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择无人机" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {optionsQuery.data?.drones.map((e) => (
                              <SelectGroup key={e.id} className="w-full">
                                <SelectLabel className="w-full">
                                  {e.callsign}
                                </SelectLabel>
                                {e.variantions.map((v) => (
                                  <SelectItem
                                    key={e.id + "-" + v.index}
                                    value={`${e.id}-${v.index}` || ""}
                                  >
                                    {v.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>

                      <Button
                        variant="destructive"
                        size="icon"
                        className="mr-2 h-8 w-8"
                        onClick={() => {
                          setSelectedDrones([]);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        disabled={!selectedDroneKey}
                        size="icon"
                        type="button"
                        className="h-8 w-8 bg-blue-400 text-gray-100 hover:bg-blue-500"
                        onClick={() => {
                          if (!selectedDroneKey) {
                            toast({
                              title: "请选择无人机",
                              description: "请重新选择无人机",
                            });
                            return;
                          }

                          const droneId = parseInt(
                            selectedDroneKey.split("-")[0]
                          );
                          const variantionIndex = parseInt(
                            selectedDroneKey.split("-")[1]
                          );

                          const drone = optionsQuery.data?.drones.find(
                            (d) => d.id === droneId
                          );
                          if (!drone) {
                            toast({
                              title: "无人机不存在",
                              description: "请重新选择无人机",
                            });
                            return;
                          }

                          const variantion = drone.variantions.find(
                            (v) => v.index === variantionIndex
                          );
                          if (!variantion) {
                            toast({
                              title: "无人机变体不存在",
                              description: "请重新选择无人机",
                            });
                            return;
                          }
                          // 生成一个随机的16进制颜色
                          const colors = [
                            "#FF5733",
                            "#33FF57",
                            "#3357FF",
                            "#F033FF",
                            "#33FFF6",
                            "#FF33A6",
                            "#FFD700",
                            "#4169E1",
                            "#32CD32",
                            "#8A2BE2",
                            "#FF6347",
                            "#20B2AA",
                          ];
                          const color =
                            colors[Math.floor(Math.random() * colors.length)];
                          console.log("color", color);

                          setSelectedDrones((prev) => {
                            return [
                              ...prev,
                              {
                                ...drone,
                                variantion: variantion,
                                color: color,
                              },
                            ];
                          });
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* 渲染已选择的无人机机型 */}
                    {selectedDrones?.map((d) => (
                      <div className="mt-4 px-1" key={d.id}>
                        <div className="flex justify-between items-start">
                          <div className="text-sm">
                            <p>{d.callsign}</p>
                            <p className="mt-2 text-gray-500">
                              {d.variantion.name}
                            </p>
                          </div>
                          <div className="flex-1" />
                          <div
                            className={`rounded-full h-4 w-4 m-2 `}
                            style={{ backgroundColor: d.color }}
                          />

                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedDrones((prev) =>
                                prev.filter((dr) => dr.id !== d.id)
                              );
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <div className="mr-2">
                            {d.variantion.gimbal?.name}
                          </div>

                          <div
                            className={`rounded-full h-3 w-3 mr-1 ${
                              d.variantion.rtk_available
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          <div className="mr-2">
                            {d.variantion.rtk_available
                              ? "RTK可用"
                              : "RTK不可用"}
                          </div>

                          <div
                            className={`rounded-full h-3 w-3 mr-1 ${
                              d.variantion.thermal_available
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          <div>
                            {d.variantion.thermal_available
                              ? "热成像可用"
                              : "热成像不可用"}
                          </div>
                        </div>
                        {
                          // 判断是否为最后一个元素，不是最后一个元素都有分隔线
                          selectedDrones?.length !== 1 ? (
                            <Separator className="my-2" />
                          ) : null
                        }
                      </div>
                    ))}
                    {selectedDrones?.length === 0 && (
                      <div className="text-sm text-gray-500">
                        请选择无人机机型
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mt-4 space-y-2 p-3 border rounded-md shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-md font-medium">航线信息</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsWaylinesCollapsed(!isWaylinesCollapsed);
                    }}
                  >
                    {isWaylinesCollapsed ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    )}
                  </Button>
                </div>
                {!isWaylinesCollapsed && (
                  <>
                    <div className="text-sm text-gray-500 flex items-center justify-between">
                      <div>已选择{selectedDrones.length}架无人机</div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (
                            path.length <= 0 ||
                            !AMapRef.current ||
                            !mapRef.current ||
                            selectedDrones.length === 0
                          ) {
                            toast({
                              title: "无法生成航线",
                              description: "请确保已选择区域和无人机",
                            });
                            return;
                          }

                          const subPaths = dividePolygonAmongDrones(
                            path,
                            selectedDrones,
                            AMapRef
                          );
                          if (!subPaths) {
                            toast({
                              title: "无法生成航线",
                              description: "请确保已选择区域和无人机",
                            });
                            return;
                          }
                          for (let i = 0; i < subPaths.length; i++) {
                            const subPath = subPaths[i];
                            const drone = selectedDrones[i];
                            setWaylineAreas((prev) => [
                              ...prev,
                              {
                                droneId: drone.id,
                                callsign: drone.callsign,
                                color: drone.color,
                                path: subPath,
                              },
                            ]);

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
                            AMapRef.current.Event.addListener(
                              subPolygon,
                              "click",
                              () => {
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
                                      if (
                                        "getLng" in point &&
                                        "getLat" in point
                                      ) {
                                        return [
                                          acc[0] + point.getLng(),
                                          acc[1] + point.getLat(),
                                        ];
                                      }
                                      return acc;
                                    },
                                    [0, 0]
                                  )
                                  .map((val) => val / 4);
                                infoWindow.open(mapRef.current, [
                                  center[0],
                                  center[1],
                                ]);
                              }
                            );

                            mapRef.current.add(subPolygon);
                          }

                          // 适应视图
                          mapRef.current.setFitView();

                          toast({
                            title: "航线已生成",
                            description: `已为${selectedDrones.length}架无人机分配区域`,
                          });
                        }}
                      >
                        生成航线
                      </Button>
                    </div>
                    {
                      // 渲染已选择的航线
                      waylineAreas?.map((e) => (
                        <>
                          <div
                            key={e.droneId}
                            className="flex justify-between items-start"
                          >
                            <div className="text-sm">
                              <p>{e.callsign}</p>
                            </div>
                            <div className="flex-1" />
                            {/* 一个颜色指示器，方便快速识别 */}
                            <div
                              className={`rounded-full h-4 w-4 m-2`}
                              style={{ backgroundColor: e.color }}
                            />

                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setWaylineAreas((prev) =>
                                  prev.filter((dr) => dr.droneId !== e.droneId)
                                );
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                          {
                            // 判断是否为最后一个元素，不是最后一个元素都有分隔线
                            waylineAreas?.length !== 1 ? (
                              <Separator className="my-2" />
                            ) : null
                          }
                        </>
                      ))
                    }
                  </>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <Button size="sm">保存</Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

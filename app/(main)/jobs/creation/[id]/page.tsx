"use client";

import { fetchJobEditionData } from "@/api/job/request";
import { JobEditionResult } from "@/api/job/types";
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
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash } from "lucide-react";
import { usePathname } from "next/navigation";
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
  const mapRef = useRef<AMap.Map | null>(null);
  const [taskInfoCollapsed, setTaskInfoCollapsed] = useState(true);
  const [dronesCollapsed, setDronesCollapsed] = useState(true);
  const [waylinesCollapsed, setWaylinesCollapsed] = useState(false);
  const pathname = usePathname();
  const id = parseInt(pathname.split("/")[3]);
  const { toast } = useToast();
  const query = useQuery({
    queryKey: ["job-creation-options"],
    queryFn: () => fetchJobEditionData(id),
  });
  const [selectedDrones, setSelectedDrones] = useState<
    JobEditionResult["drones"]
  >([]);
  const [selectedValue, setSelectedValue] = useState<string | undefined>(
    undefined
  );
  const [waylineAreas, setWaylineAreas] = useState<
    {
      droneId: number;
      callsign: string;
      color: string;
      path: AMap.LngLat[];
    }[]
  >([]);

  const pathRef = useRef<AMap.LngLat[] | null>(null);

  useEffect(() => {
    setSelectedDrones([
      {
        id: 2,
        callsign: "无人机2",
        variantions: [
          {
            index: 1,
            name: "变体1",
            gimbal: {
              id: 1,
              name: "云台1",
              description: "云台1描述",
            },
            rtk_available: true,
            thermal_available: false,
          },
        ],
      },
      {
        id: 3,
        callsign: "无人机3",
        variantions: [
          {
            index: 1,
            name: "变体1",
            gimbal: {
              id: 1,
              name: "云台1",
              description: "云台1描述",
            },
            rtk_available: true,
            thermal_available: false,
          },
          {
            index: 2,
            name: "变体2",
            gimbal: {
              id: 2,
              name: "云台2",
              description: "云台2描述",
            },
            rtk_available: false,
            thermal_available: true,
          },
        ],
      },
      {
        id: 4,
        callsign: "无人机4",
        variantions: [
          {
            index: 1,
            name: "变体1",
            gimbal: {
              id: 1,
              name: "云台1",
              description: "云台1描述",
            },
            rtk_available: true,
            thermal_available: false,
          },
          {
            index: 2,
            name: "变体2",
            gimbal: {
              id: 2,
              name: "云台2",
              description: "云台2描述",
            },
            rtk_available: false,
            thermal_available: true,
          },
        ],
      },
    ]);
  }, [query.data]);

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

        // Draw the area polygon
        pathRef.current = [
          new AMapRef.current!.LngLat(116.397128, 39.908722),
          new AMapRef.current!.LngLat(116.407128, 39.908722),
          new AMapRef.current!.LngLat(116.407128, 39.918722),
          new AMapRef.current!.LngLat(116.397128, 39.918722),
        ];
        console.log("path", pathRef.current);

        const polygon = new AMap.Polygon();
        polygon.setPath(pathRef.current);
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
        // if (query.data.area && query.data.area.points) {
        //   const path = query.data.area.points.map(
        //     (point) => new AMapRef.current!.LngLat(point.lng, point.lat)
        //   );
        //   const polygon = new AMap.Polygon({
        //     path,
        //     strokeColor: "#3366FF",
        //     strokeWeight: 2,
        //     strokeOpacity: 0.8,
        //     fillColor: "#3366FF",
        //     fillOpacity: 0.3,
        //   });

        //   mapRef.current?.add(polygon);

        //   // Fit map bounds to the polygon
        //   mapRef.current?.setFitView([polygon]);
        // }
      })
      .catch((e) => {
        console.log(e);
      });

    return () => {
      mapRef.current?.destroy();
    };
  }, []);
  // }, [query.data, query.isSuccess]);

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
                      setTaskInfoCollapsed(!taskInfoCollapsed);
                    }}
                  >
                    {taskInfoCollapsed ? (
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
                {!taskInfoCollapsed && (
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
                              }}
                              defaultValue={field.value?.toString() || ""}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="请选择区域" />
                              </SelectTrigger>
                              <SelectContent>
                                {query.data?.areas.map((e) => (
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
                          <FormDescription>
                            区域 ID 用于标识该任务的区域。
                          </FormDescription>
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
                      setDronesCollapsed(!dronesCollapsed);
                    }}
                  >
                    {dronesCollapsed ? (
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
                {!dronesCollapsed && (
                  <>
                    {/* 一条用来创建的按钮 */}
                    <div className="flex justify-between items-center">
                      <FormItem>
                        <Select
                          onValueChange={(value) => {
                            console.log("onValueChange", value);
                            setSelectedValue(value);
                            console.log("selectedValue", selectedValue);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择无人机" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {query.data?.drones.map((e) => (
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

                      <div className="flex-1" />
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
                        disabled={!selectedValue}
                        size="icon"
                        type="button"
                        className="h-8 w-8 bg-blue-400 text-gray-100 hover:bg-blue-500"
                        onClick={() => {
                          if (!selectedValue) {
                            toast({
                              title: "请选择无人机",
                              description: "请重新选择无人机",
                            });
                            return;
                          }

                          const droneId = parseInt(selectedValue.split("-")[0]);
                          const variantionIndex = parseInt(
                            selectedValue.split("-")[1]
                          );

                          const drone = query.data?.drones.find(
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

                          const newDrone = {
                            ...drone,
                            variantions: [variantion],
                          };

                          setSelectedDrones((prev) => {
                            return [...prev, newDrone];
                          });
                          setSelectedValue(undefined);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* 渲染已选择的无人机机型 */}
                    {selectedDrones?.map((d) => (
                      <>
                        {d.variantions.map((v) => (
                          <>
                            <div
                              key={d.id}
                              className="flex justify-between items-start"
                            >
                              <div className="text-sm">
                                <p>{d.callsign}</p>
                                <p className="mt-2 text-gray-500">
                                  {d.variantions[0].name}
                                </p>
                              </div>
                              <div className="flex-1" />
                              {/* 一个颜色指示器，方便快速识别 */}
                              <div
                                className={`rounded-full h-4 w-4 m-2 bg-blue-600`}
                              />

                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  // 先找到对应的机型，再删除对应的变体
                                  const drone = selectedDrones?.find(
                                    (dr) => dr.id === d.id
                                  );
                                  if (!drone) return;
                                  const newDrones = selectedDrones?.filter(
                                    (dr) => dr.id !== d.id
                                  );
                                  setSelectedDrones(newDrones);
                                  const newVariantions =
                                    drone.variantions.filter(
                                      (v) =>
                                        v.index !== drone.variantions[0].index
                                    );
                                  if (newVariantions.length === 0) {
                                    setSelectedDrones((prev) =>
                                      prev?.filter((dr) => dr.id !== d.id)
                                    );
                                  }
                                  setSelectedDrones((prev) => {
                                    return prev?.map((dr) => {
                                      if (dr.id === d.id) {
                                        return {
                                          ...dr,
                                          variantions: newVariantions,
                                        };
                                      }
                                      return dr;
                                    });
                                  });
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <div className="mr-2">{v.gimbal?.name}</div>

                              <div
                                className={`rounded-full h-3 w-3 mr-1 ${
                                  v.rtk_available
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              />
                              <div className="mr-2">
                                {v.rtk_available ? "RTK可用" : "RTK不可用"}
                              </div>

                              <div
                                className={`rounded-full h-3 w-3 mr-1 ${
                                  v.thermal_available
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              />
                              <div>
                                {v.thermal_available
                                  ? "热成像可用"
                                  : "热成像不可用"}
                              </div>
                            </div>
                            {
                              // 判断是否为最后一个元素，不是最后一个元素都有分隔线
                              selectedDrones?.length !== 1 ||
                              selectedDrones?.[0].variantions.length !== 1 ? (
                                <Separator className="my-2" />
                              ) : null
                            }
                          </>
                        ))}
                      </>
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
                      setWaylinesCollapsed(!waylinesCollapsed);
                    }}
                  >
                    {waylinesCollapsed ? (
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
                {!waylinesCollapsed && (
                  <>
                    <div className="text-sm text-gray-500 flex items-center justify-between">
                      <div>已选择{selectedDrones.length}架无人机</div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (
                            !pathRef.current ||
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

                          // 清除现有多边形
                          mapRef.current.clearMap();

                          // 计算多边形的边界
                          const bounds = pathRef.current.reduce(
                            (acc, point) => {
                              return {
                                minLng: Math.min(acc.minLng, point.getLng()),
                                maxLng: Math.max(acc.maxLng, point.getLng()),
                                minLat: Math.min(acc.minLat, point.getLat()),
                                maxLat: Math.max(acc.maxLat, point.getLat()),
                              };
                            },
                            {
                              minLng: Infinity,
                              maxLng: -Infinity,
                              minLat: Infinity,
                              maxLat: -Infinity,
                            }
                          );

                          // 根据无人机数量划分区域
                          const droneCount = selectedDrones.length;
                          const colors = [
                            "#FF5733",
                            "#33FF57",
                            "#3357FF",
                            "#F033FF",
                            "#FF33A6",
                            "#33FFF6",
                          ];

                          // 计算每个区域的宽度
                          const lngRange = bounds.maxLng - bounds.minLng;
                          const segmentWidth = lngRange / droneCount;

                          // 为每个无人机创建区域
                          for (let i = 0; i < droneCount; i++) {
                            const minLng = bounds.minLng + i * segmentWidth;
                            const maxLng =
                              bounds.minLng + (i + 1) * segmentWidth;

                            // 创建子区域的多边形路径
                            // Create sub-area polygon path
                            const subPath = [
                              new AMapRef.current.LngLat(minLng, bounds.minLat),
                              new AMapRef.current.LngLat(maxLng, bounds.minLat),
                              new AMapRef.current.LngLat(maxLng, bounds.maxLat),
                              new AMapRef.current.LngLat(minLng, bounds.maxLat),
                            ];

                            // Store subPath to state
                            setWaylineAreas((prev) => [
                              ...prev,
                              {
                                droneId: selectedDrones[i].id,
                                callsign: selectedDrones[i].callsign,
                                color: colors[i % colors.length],
                                path: subPath,
                              },
                            ]);

                            // 创建子区域多边形
                            const subPolygon = new AMapRef.current.Polygon();
                            subPolygon.setPath(subPath);
                            subPolygon.setOptions({
                              strokeColor: colors[i % colors.length],
                              strokeWeight: 2,
                              strokeOpacity: 1,
                              fillColor: colors[i % colors.length],
                              fillOpacity: 0.3,
                            });

                            // 添加无人机信息到多边形
                            const droneInfo = selectedDrones[i].callsign;
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
                            description: `已为${droneCount}架无人机分配区域`,
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
                              className={`rounded-full h-4 w-4 m-2 bg-blue-600`}
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

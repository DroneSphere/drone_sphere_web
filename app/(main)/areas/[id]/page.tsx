"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useIsCreateMode } from "@/lib/misc";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createArea, deleteArea, fetchArea, updateArea } from "./requests";

const columnHelper = createColumnHelper<{
  lng?: number;
  lat?: number;
}>();

const columns = [
  columnHelper.accessor("lng", {
    header: () => "经度",
  }),
  columnHelper.accessor("lat", {
    header: () => "纬度",
  }),
];

const formSchema = z.object({
  name: z.string().min(1, "区域名称不能为空"),
  description: z.string().optional(),
  points: z.array(
    z.object({
      lng: z.number().optional(),
      lat: z.number().optional(),
    })
  ),
});

export default function AreaDetailPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const AMapRef = useRef<typeof AMap | null>(null);
  const mapRef = useRef<AMap.Map | null>(null);
  const placeSearchRef = useRef<unknown | null>(null);
  const polygonRef = useRef<AMap.Polygon | null>(null);
  const polygonEditorRef = useRef<AMap.PolygonEditor | null>(null);
  const [amapLoaded, setAmapLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<
    { lng?: number; lat?: number }[]
  >([]);

  const { isCreateMode: isCreating, idPart } = useIsCreateMode();

  // 只有在非创建模式下才获取数据
  const query = useQuery({
    queryKey: ["areas", idPart],
    queryFn: () => {
      return fetchArea({
        id: Number(idPart),
      });
    },
    enabled: !isCreating && !!idPart,
  });

  // 创建区域的mutation
  const createMutation = useMutation({
    mutationFn: createArea,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      toast({
        title: "创建成功",
        description: "已成功创建新区域",
      });
      router.push(`/areas/${data.id}`);
    },
  });

  // 更新区域的mutation
  const updateMutation = useMutation({
    mutationFn: updateArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas", idPart] });
      setIsEditing(false);
      toast({
        title: "更新成功",
        description: "区域信息已更新",
      });
    },
  });

  // 删除区域的mutation
  const deleteMutation = useMutation({
    mutationFn: deleteArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      toast({
        title: "删除成功",
        description: "区域已删除",
      });
      router.push("/areas");
    },
  });

  // 表单处理
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      points: [],
    },
  });

  // 处理多边形点数据，过滤无效点并返回有效点数组
  const processPolygonPoints = (
    polygonPoints: { lng?: number; lat?: number }[]
  ) => {
    // 过滤掉没有经纬度的点，并确保所有值都是非可选的
    const validPoints = polygonPoints
      .filter((point) => point.lng !== undefined && point.lat !== undefined)
      .map((point) => ({
        lng: point.lng!,
        lat: point.lat!,
      }));

    return validPoints;
  };

  // 验证多边形数据是否有效，至少需要3个有效点
  const validatePolygonData = (
    pointsData: { lng?: number; lat?: number }[]
  ) => {
    if (!pointsData || pointsData.length < 3) {
      toast({
        title: "区域数据错误",
        description: "请至少绘制三个点以形成一个有效的区域",
        variant: "destructive",
      });
      return false;
    }

    const validPoints = processPolygonPoints(pointsData);

    if (validPoints.length < 3) {
      toast({
        title: "区域数据错误",
        description: "有效的点数量不足，请确保所有点都有经纬度值",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // 表单提交回调函数
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // 验证多边形数据
    if (!validatePolygonData(polygonPoints)) {
      return;
    }
    // 获取有效点位数据
    const validPoints = processPolygonPoints(polygonPoints);

    if (isCreating) {
      // 创建区域
      createMutation.mutate({
        ...data,
        points: validPoints,
      });
    } else {
      // 更新区域 - 确保传递正确的类型
      updateMutation.mutate({
        id: Number(idPart),
        ...data,
        points: validPoints,
      });
    }
  };

  // 节点信息表格
  const table = useReactTable({
    data: polygonPoints,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // 初始化数据
  useEffect(() => {
    if (query.data && !isCreating) {
      form.reset({
        name: query.data.name || "",
        description: query.data.description || "",
        points: query.data.points,
      });
      // 设置多边形点数据
      if (query.data.points) {
        const points = query.data.points.map((point) => ({
          lng: point.lng,
          lat: point.lat,
        }));
        setPolygonPoints(points);
      } else {
        setPolygonPoints([]);
        toast({
          title: "区域数据错误",
          description: "区域数据不完整，请检查数据",
          variant: "destructive",
        });
      }
    }
  }, [query.data, isCreating, form]);

  // 处理地图绘制的多边形
  useEffect(() => {
    if (!amapLoaded || !AMapRef.current || !mapRef.current) return;

    // 清除现有的多边形
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }

    // 如果有点数据，绘制多边形
    if (polygonPoints.length > 2) {
      const path = polygonPoints.map(
        (point) => new AMapRef.current!.LngLat(point.lng!, point.lat!)
      );

      const polygon = new AMapRef.current!.Polygon();
      polygon.setPath(path);
      polygon.setOptions({
        strokeColor: "#6699FF",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#66CCFF",
        fillOpacity: 0.4,
      });
      polygon.on("mouseover", function () {
        polygon.setOptions({ fillOpacity: 0.2 });
      });

      polygon.on("mouseout", function () {
        polygon.setOptions({ fillOpacity: 0.4 });
      });

      polygon.setMap(mapRef.current);
      polygonRef.current = polygon;
      mapRef.current.setFitView([polygon]);

      // 如果处于创建或编辑模式，启用多边形编辑
      if ((isCreating || isEditing) && polygonEditorRef.current) {
        polygonEditorRef.current.setTarget(polygon);
        polygonEditorRef.current.open();
      }
    }

    return () => {
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
      }
    };
  }, [polygonPoints, amapLoaded, isCreating, isEditing]);

  // 挂载地图
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
        console.log("AMap initialized");

        mapRef.current = new AMap.Map("map", {
          viewMode: "3D",
          zoom: 17,
        });

        AMap.plugin(
          [
            "AMap.ToolBar",
            "AMap.Scale",
            "AMap.PolygonEditor",
            "AMap.MouseTool",
            "AMap.Geolocation",
            "AMap.PlaceSearch",
          ],
          function () {
            const tool = new AMap.ToolBar();
            mapRef.current?.addControl(tool);

            const scale = new AMap.Scale();
            mapRef.current?.addControl(scale);

            const placeSearch = new AMap.PlaceSearch({
              pageSize: 5, //单页显示结果条数
              pageIndex: 1, //页码
              citylimit: false, //是否强制限制在设置的城市内搜索
              map: mapRef.current, //展示结果的地图实例
              panel: "search-panel", //参数值为你页面定义容器的 id 值<div id="my-panel"></div>，结果列表将在此容器中进行展示。
              autoFitView: true, //是否自动调整地图视野使绘制的 Marker 点都处于视口的可见范围
            });
            placeSearchRef.current = placeSearch;

            // 初始化多边形编辑器
            polygonEditorRef.current = new AMap.PolygonEditor(mapRef.current);

            // 如果是创建模式，初始化鼠标绘制工具
            if (isCreating) {
              const mouseTool = new AMap.MouseTool(mapRef.current);

              // 开启多边形绘制模式
              mouseTool.polygon({
                strokeColor: "#6699FF",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#66CCFF",
                fillOpacity: 0.4,
              });

              // 绘制完成事件
              // @ts-expect-error - AMap MouseTool draw event typing is not properly defined in the types
              mouseTool.on("draw", function (event) {
                // 获取绘制的多边形
                const polygon = event.obj;

                // 保存多边形路径点
                const path = polygon.getPath();
                const points = path.map(
                  (point: { getLng: () => number; getLat: () => number }) => ({
                    lng: point.getLng(),
                    lat: point.getLat(),
                  })
                );

                setPolygonPoints(points);

                // 启用多边形编辑
                polygonEditorRef.current?.setTarget(polygon);
                polygonEditorRef.current?.open();

                // 监听编辑事件
                AMap.Event.addListener(
                  polygonEditorRef.current,
                  "adjust",
                  function () {
                    const newPath = polygon.getPath();
                    const newPoints = newPath.map(
                      (point: {
                        getLng: () => number;
                        getLat: () => number;
                      }) => ({
                        lng: point.getLng(),
                        lat: point.getLat(),
                      })
                    );
                    setPolygonPoints(newPoints);
                  }
                );
                // 监听删除事件
                AMap.Event.addListener(
                  polygonEditorRef.current,
                  "delete",
                  function () {
                    // 清除多边形
                    polygon.setMap(null);
                    polygonRef.current = null;
                    setPolygonPoints([]);
                  }
                );
              });
            }

            // 初始化定位
            const geolocation = new AMap.Geolocation({
              enableHighAccuracy: true, // 是否使用高精度定位，默认：true
              timeout: 10000, // 设置定位超时时间，默认：无穷大
              offset: [20, 100], // 定位按钮的停靠位置的偏移量
              zoomToAccuracy: true, //  定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
              position: "RB", //  定位按钮的排放位置,  RB表示右下
            });
            mapRef.current?.addControl(geolocation);
          }
        );

        setAmapLoaded(true);
      })
      .catch((e) => {
        console.log(e);
        toast({
          title: "地图加载失败",
          description: "无法加载高德地图，请检查网络连接",
          variant: "destructive",
        });
      });

    return () => {
      mapRef.current?.destroy();
      setAmapLoaded(false);
    };
  }, [isCreating]);

  // 计算面积
  const calculateArea = () => {
    if (!polygonPoints || polygonPoints.length < 3 || !AMapRef.current)
      return 0;

    const path = polygonPoints.map(
      (point) => new AMapRef.current!.LngLat(point.lng!, point.lat!)
    );

    // 计算多边形面积（平方米）
    const area = AMapRef.current.GeometryUtil.ringArea(path);
    return area;
  };

  // 计算长度
  const calculateLength = () => {
    if (!polygonPoints || polygonPoints.length < 2 || !AMapRef.current)
      return 0;

    const path = polygonPoints.map(
      (point) => new AMapRef.current!.LngLat(point.lng!, point.lat!)
    );

    // 计算多边形周长（米）
    const length = AMapRef.current.GeometryUtil.distanceOfLine(path);
    return length;
  };

  // 开启编辑模式
  const handleStartEditing = () => {
    setIsEditing(true);
    console.log("handleStartEditing", polygonRef.current);

    // 如果已有多边形，启用编辑
    if (polygonRef.current && polygonEditorRef.current) {
      polygonEditorRef.current.setTarget(polygonRef.current);
      polygonEditorRef.current.open();

      // 监听编辑事件
      AMapRef.current?.Event.addListener(
        polygonEditorRef.current,
        "adjust",
        function () {
          const newPath = polygonRef.current!.getPath();
          const newPoints = newPath!.map((point) => {
            // Check if point is a LngLat instance
            if (point instanceof AMapRef.current!.LngLat) {
              return {
                lng: point.getLng(),
                lat: point.getLat(),
              };
            }
            // Handle case where point might be an array
            return {
              lng: 0,
              lat: 0,
            };
          });
          setPolygonPoints(newPoints);
        }
      );
    }
  };

  // 取消编辑模式
  const handleCancelEditing = () => {
    setIsEditing(false);

    // 重置为原始数据
    if (query.data?.points) {
      setPolygonPoints(query.data.points);
      form.reset({
        points: query.data.points,
      });
    }

    // 关闭多边形编辑器
    if (polygonEditorRef.current) {
      polygonEditorRef.current.close();
    }
  };

  // 计算区域面积
  const areaSize = calculateArea();
  const areaSizeDisplay =
    areaSize > 10000
      ? `${(areaSize / 10000).toFixed(2)} 公顷`
      : `${areaSize.toFixed(2)} 平方米`;

  // 计算周长
  const areaLength = calculateLength();
  const areaLengthDisplay =
    areaLength > 1000
      ? `${(areaLength / 1000).toFixed(2)} 公里`
      : `${areaLength.toFixed(2)} 米`;

  const isLoading =
    (isCreating ? false : query.isLoading) ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="px-4 mb-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* 标题与描述 */}
          <div className="flex-1">
            {isCreating || isEditing ? (
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>区域名称</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入区域名称" {...field} />
                      </FormControl>
                      <FormDescription>
                        该名称将用于识别区域，请确保其唯一性。
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
                      <FormLabel>区域描述</FormLabel>
                      <FormControl>
                        <Textarea placeholder="请输入区域描述" {...field} />
                      </FormControl>
                      <FormDescription>
                        描述用于对该区域进行标识和说明，可以是任何信息。
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xl">{query.data?.name}</div>
                <div className="text-sm text-gray-500">
                  {query.data?.description}
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <div
              id="map"
              className="h-[calc(100vh-200px)] w-full border rounded-md shadow-sm"
            ></div>

            <div className="flex flex-col w-[400px] gap-4">
              <div>
                <div className="space-y-2 pb-2 border-t border-l border-r rounded-t-md shadow-sm">
                  <div className="px-3 mt-3 text-sm font-medium">地图搜索</div>
                  <div className="px-3 pb-2">
                    <Input 
                      placeholder="输入地点名称搜索" 
                      onChange={(e) => {
                        if (placeSearchRef.current && e.target.value.trim()) {
                          // @ts-expect-error - PlaceSearch type not properly defined
                          placeSearchRef.current.search(e.target.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && placeSearchRef.current) {
                          e.preventDefault();
                          // @ts-expect-error - PlaceSearch type not properly defined
                          placeSearchRef.current.search(e.currentTarget.value);
                        }
                      }}
                      className="p-2 border rounded-md shadow-sm"
                    />
                  </div>
                </div>
                <div id="search-panel" className="w-full h-full" />
              </div>
              {polygonPoints.length > 0 && (
                <div className="space-y-2 overflow-auto border rounded-md shadow-sm">
                  <div className="px-3 mt-3 text-sm font-medium">节点信息</div>
                  <Table className="">
                    <TableHeader className="bg-gray-100">
                      <TableRow>
                        {table.getHeaderGroups().map((headerGroup) =>
                          headerGroup.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              className="text-center text-sm h-8 min-w-32"
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="text-sm hover:bg-gray-50 "
                        >
                          {row.getVisibleCells().map((cell) => (
                            // 居中
                            <TableCell
                              key={cell.id}
                              className="text-center py-2 px-0"
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {polygonPoints.length > 0 && (
                <div className="space-y-2 p-3 border rounded-md shadow-sm">
                  <div className="text-sm font-medium">区域信息</div>
                  <div className="grid grid-cols-2 gap-1">
                    <span className="text-sm text-gray-500">总面积:</span>
                    <span className="text-sm font-medium">
                      {areaSizeDisplay}
                    </span>

                    <span className="text-sm text-gray-500">总顶点:</span>
                    <span className="text-sm font-medium">
                      {polygonPoints.length}个
                    </span>

                    <span className="text-sm text-gray-500">周长:</span>
                    <span className="text-sm font-medium">
                      {areaLengthDisplay}
                    </span>

                    {query.data?.created_at && (
                      <>
                        <span className="text-sm text-gray-500">创建日期:</span>
                        <span className="text-sm font-medium">
                          {query.data.created_at}
                        </span>
                      </>
                    )}
                    {query.data?.updated_at && (
                      <>
                        <span className="text-sm text-gray-500">编辑日期:</span>
                        <span className="text-sm font-medium">
                          {query.data.updated_at}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 控制按钮 */}
              {polygonPoints.length > 0 && (
                <div className="flex space-x-2 justify-end">
                  {/* 创建模式 */}
                  {isCreating && !isEditing && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        type="submit"
                        disabled={isLoading}
                      >
                        保存
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/areas")}
                      >
                        取消
                      </Button>
                    </>
                  )}
                  {/* 编辑模式 */}
                  {isEditing && !isCreating && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        type="submit"
                        disabled={isLoading}
                      >
                        保存
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEditing}
                      >
                        取消
                      </Button>
                    </>
                  )}
                  {/* 查看模式 */}
                  {!isEditing && !isCreating && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={handleStartEditing}
                      >
                        编辑
                      </Button>
                      <Dialog>
                        <Button
                          size="sm"
                          variant="destructive"
                          type="button"
                          asChild
                        >
                          <DialogTrigger>删除</DialogTrigger>
                        </Button>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>删除区域</DialogTitle>
                            <DialogDescription>
                              您确定要删除这个区域吗？此操作不可撤销。
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="destructive"
                              onClick={() => deleteMutation.mutate(idPart)}
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending
                                ? "删除中..."
                                : "确认删除"}
                            </Button>
                            <DialogClose asChild>
                              <Button variant="outline">取消</Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

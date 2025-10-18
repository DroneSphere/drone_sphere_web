"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
// import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { createArea, fetchArea, updateArea } from "./requests";

interface Point {
  index: number; // 保持 index 用于显示 (1-based)
  lng: number;
  lat: number;
}

const formSchema = z.object({
  name: z.string().min(1, "区域名称不能为空"),
  description: z.string().optional(),
});

export default function AreaDetailPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const AMapRef = useRef<typeof AMap | null>(null);
  const mapRef = useRef<AMap.Map | null>(null);
  const placeSearchRef = useRef<unknown | null>(null);
  const polygonRef = useRef<AMap.Polygon | null>(null);
  const markersRef = useRef<AMap.Marker[]>([]); // 新增: 用于存储顶点 Marker 的 ref
  const polygonEditorRef = useRef<AMap.PolygonEditor | null>(null);
  const [amapLoaded, setAmapLoaded] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);

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
      toast({
        title: "更新成功",
        description: "区域信息已更新",
      });
    },
  });

  // 表单处理
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
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

  const columnHelper = createColumnHelper<Point>();

  const columns = [
    columnHelper.accessor("index", {
      header: () => "序号",
      cell: (info) => info.getValue(), // 直接显示 point.index
      size: 40, // 可以指定一个较小的尺寸
    }),
    columnHelper.accessor("lng", {
      header: () => "经度",
      // 在表格渲染时动态决定单元格内容
      cell: (info) => {
        const rowIndex = info.row.index; // 获取当前行的实际数组索引 (0-based)
        const value = info.getValue();
        return (
          <Input
            type="number" // 使用 number 类型以便输入
            step="0.00001" // 修改步长，控制增减粒度为小数点后6位
            defaultValue={value} // 使用 defaultValue 避免每次渲染重置光标
            onBlur={(e) => handlePointUpdate(rowIndex, "lng", e.target.value)} // 失去焦点时更新，传递 rowIndex
            className="h-4 pl-3 pr-1 text-center border-none focus-visible:ring-1 focus-visible:ring-offset-0" // 简化样式
            // 可以添加 onKeyDown 处理 Enter 键提交等
          />
        );
      },
    }),
    columnHelper.accessor("lat", {
      header: () => "纬度",
      // 类似地处理纬度
      cell: (info) => {
        const rowIndex = info.row.index; // 获取当前行的实际数组索引 (0-based)
        const value = info.getValue();
        return (
          <Input
            type="number"
            step="0.00001" // 修改步长，控制增减粒度为小数点后6位
            defaultValue={value}
            onBlur={(e) => handlePointUpdate(rowIndex, "lat", e.target.value)} // 失去焦点时更新，传递 rowIndex
            className="h-4 pl-3 pr-1 text-center border-none focus-visible:ring-1 focus-visible:ring-offset-0"
          />
        );
      },
    }),
  ];

  // 节点信息表格
  const table = useReactTable({
    data: polygonPoints,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // 修改 handlePointUpdate 接受 rowIndex
  const handlePointUpdate = (
    rowIndex: number, // 参数改为 rowIndex (0-based)
    field: "lng" | "lat",
    value: string
  ) => {
    const numericValue = parseFloat(value); // 将输入值转为数字
    if (isNaN(numericValue)) {
      // 可以添加错误提示，例如使用 toast
      toast({
        title: "输入无效",
        description: "请输入有效的经纬度数值",
        variant: "destructive",
      });
      return; // 如果转换失败则不更新
    }

    setPolygonPoints((currentPoints) => {
      const newPoints = [...currentPoints]; // 创建新数组以避免直接修改状态
      if (newPoints[rowIndex]) {
        // 使用 rowIndex 访问
        // 只更新经纬度，不改变 index
        newPoints[rowIndex] = { ...newPoints[rowIndex], [field]: numericValue };
      }
      return newPoints; // 返回更新后的数组
    });
  };

  // 初始化数据
  useEffect(() => {
    if (query.data) {
      form.reset({
        name: query.data.name || "",
        description: query.data.description || "",
      });
      // 设置多边形点数据
      if (query.data.points) {
        // 确保 index 从 1 开始
        const points: Point[] = query.data.points.map((point, idx) => ({
          index: idx,
          lng: point.lng,
          lat: point.lat,
        }));
        console.log("points loaded", points);

        setPolygonPoints(points);

        // 等待一段时间设置地图视野
        setTimeout(() => {
          if (mapRef.current && polygonRef.current) {
            mapRef.current.setFitView([polygonRef.current], true);
          }
        }, 500);
      } else {
        setPolygonPoints([]);
        // 移除之前的 toast 提示，因为可能是新创建的区域
        // toast({
        //   title: "区域数据错误",
        //   description: "区域数据不完整，请检查数据",
        //   variant: "destructive",
        // });
      }
    }
  }, [query.data, form]);

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
      const path: AMap.LngLat[] = []; // 用于存储多边形路径点
      const newMarkers: AMap.Marker[] = []; // 用于临时存储新创建的 Markers

      // 遍历状态中的多边形点
      polygonPoints.forEach((point) => {
        // 确保点坐标有效
        if (point.lng !== undefined && point.lat !== undefined) {
          const lngLat = new AMapRef.current!.LngLat(point.lng, point.lat);
          path.push(lngLat); // 添加到多边形路径

          // 创建一个新的 Marker
          const marker = new AMapRef.current!.Marker({
            position: lngLat, // 设置 Marker 位置
            // icon: "//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png", // 可选：自定义图标
            offset: new AMapRef.current!.Pixel(-1, -1), // 可选：图标偏移量
            title: `${point.index}`, // 可选：鼠标悬停提示
            label: {
              // 可选：添加标签显示序号
              content: `${point.index}`,
              offset: new AMapRef.current!.Pixel(-16, -2), // 标签相对图标的位置
              direction: "center", // 标签方向
            },
          });
          newMarkers.push(marker); // 将新 Marker 添加到临时数组
        }
      });

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
      // 清除之前的 Marker
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      mapRef.current?.add(newMarkers);

      polygonRef.current = polygon;
      markersRef.current = newMarkers; // 更新引用

      // mapRef.current.setFitView([polygon]);

      // 如果处于创建模式，启用多边形编辑
      if (polygonEditorRef.current) {
        polygonEditorRef.current.setTarget(polygon);
        polygonEditorRef.current.open();
        console.log("polygonEditorRef.current", polygonEditorRef.current);
      }
    }

    return () => {
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
      }
    };
  }, [polygonPoints, amapLoaded, isCreating]);

  // 挂载地图
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window._AMapSecurityConfig = {
        securityJsCode: "4ef657a379f13efbbf096baf8b08b3ed",
      };
    }

    import("@amap/amap-jsapi-loader").then(({ default: AMapLoader }) => {
      return AMapLoader.load({
        key: "82ea7ca3d47546f079185e7ccdade9ba",
        version: "2.0",
      });
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
            "AMap.MapType",
            "AMap.ToolBar",
            "AMap.Scale",
            "AMap.PolygonEditor",
            "AMap.MouseTool",
            "AMap.Geolocation",
            "AMap.PlaceSearch",
          ],
          function () {
            const mapType = new AMap.MapType({
              defaultType: 0, //使用2D
            });
            mapRef.current?.addControl(mapType);

            const tool = new AMap.ToolBar();
            mapRef.current?.addControl(tool);

            const scale = new AMap.Scale();
            mapRef.current?.addControl(scale);

            const placeSearch = new AMap.PlaceSearch({
              pageSize: 10, //单页显示结果条数增加到10条
              pageIndex: 1, //页码
              citylimit: false, //是否强制限制在设置的城市内搜索
              map: mapRef.current, //展示结果的地图实例
              panel: "search-panel", //参数值为你页面定义容器的 id 值<div id="my-panel"></div>，结果列表将在此容器中进行展示。
              autoFitView: true, //是否自动调整地图视野使绘制的 Marker 点都处于视口的可见范围
            });

            // 添加搜索完成事件监听
            AMap.Event.addListener(placeSearch, 'complete', function(data: unknown) {
              console.log('搜索完成:', data);
              // 搜索完成后的处理逻辑已经由高德地图自动处理
              // 结果会显示在panel指定的容器中
            });

            // 添加搜索错误事件监听
            AMap.Event.addListener(placeSearch, 'error', function(error: unknown) {
              console.error('搜索错误:', error);
              toast({
                title: "搜索失败",
                description: "无法找到相关地点，请尝试其他关键词",
                variant: "destructive",
              });
            });
            placeSearchRef.current = placeSearch;

            // 初始化多边形编辑器
            polygonEditorRef.current = new AMap.PolygonEditor(mapRef.current);

            // --- 修改 PolygonEditor 事件监听器 ---

            // 监听 adjust 事件 (拖拽调整顶点)
            AMap.Event.addListener(
              polygonEditorRef.current,
              "adjust",
              function () {
                const newPath = polygonRef.current?.getPath();
                if (!newPath) return;

                // 只更新经纬度，不改变 index 或顺序
                setPolygonPoints((currentPoints) => {
                  const updatedPoints = currentPoints.map((point, idx) => {
                    const newLngLat = (newPath as AMap.LngLat[])[idx];
                    if (newLngLat instanceof AMap.LngLat) {
                      return {
                        ...point, // 保留原始 index
                        lng: newLngLat.getLng(),
                        lat: newLngLat.getLat(),
                      };
                    }
                    return point; // Fallback, should not happen if lengths match
                  });
                  return updatedPoints;
                });
              }
            );

            // 监听 addnode 事件 (添加顶点)
            AMap.Event.addListener(
              polygonEditorRef.current,
              "addnode",
              function () {
                const newPath = polygonRef.current?.getPath();
                if (!newPath) return;
                // 重新生成 points 数组，并重新分配 index
                const newPoints: Point[] = [];
                (newPath as AMap.LngLat[]).forEach((point, idx) => {
                  if (point instanceof AMap.LngLat) {
                    newPoints.push({
                      index: idx + 1, // 重新分配 1-based index
                      lng: point.getLng(),
                      lat: point.getLat(),
                    });
                  }
                });
                setPolygonPoints(newPoints);
              }
            );

            // 监听 removenode 事件 (删除顶点)
            AMap.Event.addListener(
              polygonEditorRef.current,
              "removenode",
              function () {
                const newPath = polygonRef.current?.getPath();
                if (!newPath) return;
                // 重新生成 points 数组，并重新分配 index
                const newPoints: Point[] = [];
                (newPath as AMap.LngLat[]).forEach((point, idx) => {
                  if (point instanceof AMap.LngLat) {
                    newPoints.push({
                      index: idx + 1, // 重新分配 1-based index
                      lng: point.getLng(),
                      lat: point.getLat(),
                    });
                  }
                });
                setPolygonPoints(newPoints);
              }
            );

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
                const points: Point[] = [];
                (path as AMap.LngLat[]).forEach((point, index) => {
                  if (point instanceof AMap.LngLat) {
                    points.push({
                      index: index + 1, // 确保 index 从 1 开始
                      lng: point.getLng(),
                      lat: point.getLat(),
                    });
                  }
                });

                setPolygonPoints(points);

                // 启用多边形编辑
                polygonEditorRef.current?.setTarget(polygon);
                polygonEditorRef.current?.open();

                // 清除当前鼠标绘制工具
                polygon.setMap(null);
                mouseTool.close();
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
  }, [isCreating]); // 依赖项保持不变

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
    // 至少需要3个点才能形成一个闭合多边形来计算周长
    if (!polygonPoints || polygonPoints.length < 3 || !AMapRef.current)
      return 0;

    const path = polygonPoints.map(
      (point) => new AMapRef.current!.LngLat(point.lng!, point.lat!)
    );

    // 将第一个点添加到路径末尾以闭合多边形
    path.push(
      new AMapRef.current!.LngLat(polygonPoints[0].lng!, polygonPoints[0].lat!)
    );

    // 计算闭合多边形的总周长（米）
    const length = AMapRef.current.GeometryUtil.distanceOfLine(path);
    return length;
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
    updateMutation.isPending;

  return (
    <div className="px-4 mb-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex space-x-4">
            <div
              id="map"
              className="h-[calc(100vh-132px)] w-full border rounded-md shadow-sm"
            ></div>
            {/* 修改右侧面板容器结构 */}
            <div className="flex flex-col w-[420px] h-[calc(100vh-132px)] min-w-[420px] max-w-[420px] flex-shrink-0">
              {/* 固定区域信息表单 */}
              <div className="space-y-2 p-3 border rounded-md shadow-sm flex-shrink-0">
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 动态内容区域 */}
              <div className="flex-1 min-h-0 overflow-hidden pt-3">
                {isCreating && (
                  <div className="flex flex-col border border-gray-200 rounded-md shadow-sm bg-white overflow-hidden h-full w-full min-w-full max-w-full">
                    <div className="p-3 border-b border-gray-200 flex-shrink-0">
                      <div className="text-sm font-medium text-gray-900 mb-2">
                        地图搜索
                      </div>
                      <Input
                        placeholder="输入地点名称搜索"
                        onChange={(e) => {
                          // 延迟搜索，避免输入时频繁请求
                          const value = e.target.value.trim();
                          if (placeSearchRef.current && value.length >= 2) {
                            // 使用setTimeout延迟搜索
                            setTimeout(() => {
                              if (placeSearchRef.current && value === e.target.value.trim()) {
                                // @ts-expect-error - PlaceSearch type not properly defined
                                placeSearchRef.current.search(value);
                              }
                            }, 300);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && placeSearchRef.current) {
                            e.preventDefault();
                            const value = e.currentTarget.value.trim();
                            if (value) {
                              // @ts-expect-error - PlaceSearch type not properly defined
                              placeSearchRef.current.search(value);
                            }
                          }
                        }}
                        className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div
                      id="search-panel"
                      className="flex-1 overflow-y-auto bg-gray-50 min-h-0 w-full min-w-full max-w-full"
                      style={{ height: '0px' }} // 让flexbox控制高度
                    />
                    <style jsx>{`
                      #search-panel,
                      #search-panel > div {
                        height: 100% !important;
                        width: 100% !important;
                        display: flex !important;
                        flex-direction: column !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        min-width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                      }

                      #search-panel .amap_lib_placeSearch,
                      #search-panel .amap-lib-place-search {
                        height: 100% !important;
                        width: 100% !important;
                        display: flex !important;
                        flex-direction: column !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        min-width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                      }

                      #search-panel .amap_lib_placeSearch_list,
                      #search-panel .amap-lib-place-search-list {
                        flex: 1 !important;
                        overflow-y: auto !important;
                        padding: 6px !important;
                        margin: 0 !important;
                        display: flex !important;
                        flex-direction: column !important;
                      }

                      #search-panel .amap_lib_placeSearch_list_item,
                      #search-panel .amap-lib-place-search-list-item {
                        margin-bottom: 3px !important;
                        padding: 10px 8px !important;
                        border-radius: 6px !important;
                        background: white !important;
                        border: 1px solid #e5e7eb !important;
                        transition: all 0.2s ease !important;
                        min-height: 54px !important;
                        flex-shrink: 0 !important;
                      }

                      #search-panel .amap_lib_placeSearch_list_item:hover,
                      #search-panel .amap-lib-place-search-list-item:hover {
                        background: #f9fafb !important;
                        border-color: #d1d5db !important;
                        transform: translateY(-1px) !important;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
                      }

                      #search-panel .amap_lib_placeSearch_list_item h3,
                      #search-panel .amap-lib-place-search-list-item h3 {
                        font-size: 13px !important;
                        font-weight: 600 !important;
                        margin-bottom: 4px !important;
                        color: #111827 !important;
                        line-height: 1.2 !important;
                      }

                      #search-panel .amap_lib_placeSearch_list_item p,
                      #search-panel .amap-lib-place-search-list-item p {
                        font-size: 11px !important;
                        color: #6b7280 !important;
                        line-height: 1.3 !important;
                        margin: 1px 0 !important;
                      }

                      #search-panel .amap_lib_placeSearch_page,
                      #search-panel .amap-lib-place-search-page {
                        padding: 8px 6px !important;
                        background: white !important;
                        border-top: 1px solid #e5e7eb !important;
                        margin: 0 !important;
                        flex-shrink: 0 !important;
                      }

                      #search-panel .amap_lib_placeSearch_page a,
                      #search-panel .amap-lib-place-search-page a {
                        margin: 0 1px !important;
                        padding: 4px 8px !important;
                        border-radius: 3px !important;
                        font-size: 11px !important;
                        font-weight: 500 !important;
                        border: 1px solid #d1d5db !important;
                        background: white !important;
                        color: #374151 !important;
                        text-decoration: none !important;
                        transition: all 0.2s ease !important;
                      }

                      #search-panel .amap_lib_placeSearch_page a:hover,
                      #search-panel .amap-lib-place-search-page a:hover,
                      #search-panel .amap_lib_placeSearch_page a.cur,
                      #search-panel .amap-lib-place-search-page a.cur {
                        background: #3b82f6 !important;
                        color: white !important;
                        border-color: #3b82f6 !important;
                      }

                      /* 确保整个搜索面板填满高度 */
                      #search-panel .poi-list {
                        height: 100% !important;
                        display: flex !important;
                        flex-direction: column !important;
                      }

                      /* 减少不必要的间距 */
                      #search-panel * {
                        box-sizing: border-box !important;
                      }
                    `}</style>
                  </div>
                )}

                {!isCreating && polygonPoints.length > 0 && (
                  <div className="h-full overflow-y-auto space-y-3 pr-2">
                    {/* 节点信息表格 */}
                    <div className="border rounded-md shadow-sm">
                      <div className="px-3 pt-3 text-sm font-medium">
                        节点信息
                      </div>
                      <Table className="">
                        <TableHeader className="bg-gray-100">
                          <TableRow>
                            {table.getHeaderGroups().map((headerGroup) =>
                              headerGroup.headers.map((header) => (
                                <TableHead
                                  key={header.id}
                                  className="text-center text-sm h-8 min-w-16"
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

                    {/* 区域信息 */}
                    <div className="p-3 border rounded-md shadow-sm">
                      <div className="text-sm font-medium mb-2">区域信息</div>
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
                            <span className="text-sm text-gray-500">
                              创建日期:
                            </span>
                            <span className="text-sm font-medium">
                              {query.data.created_at}
                            </span>
                          </>
                        )}
                        {query.data?.updated_at && (
                          <>
                            <span className="text-sm text-gray-500">
                              编辑日期:
                            </span>
                            <span className="text-sm font-medium">
                              {query.data.updated_at}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 固定底部按钮 */}
              <div className="flex space-x-2 justify-end pt-2 border-t flex-shrink-0">
                <Button
                  size="default"
                  variant="default"
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                >
                  保存
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

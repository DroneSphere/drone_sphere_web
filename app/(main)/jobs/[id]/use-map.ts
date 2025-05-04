import { useEffect, useRef, useState, useCallback } from 'react';
import AMapLoader from "@amap/amap-jsapi-loader";
import { WaylineAreaState } from './job-state';

export function useMap() {
  // 地图相关状态
  const AMapRef = useRef<typeof AMap | null>(null);
  const mapRef = useRef<AMap.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  // 地图元素引用
  const activeEditorRef = useRef<number>(-1);
  const infoWindowsRef = useRef<AMap.InfoWindow[]>([]);
  const polygonsRef = useRef<AMap.Polygon[]>([]);
  const editorsRef = useRef<AMap.PolygonEditor[]>([]);
  const polylinesRef = useRef<AMap.Polyline[]>([]);
  const markersRef = useRef<AMap.Marker[][]>([]);

  // 加载地图
  const initMap = useCallback(async () => {
    try {
      const AMap = await AMapLoader.load({
        key: "82ea7ca3d47546f079185e7ccdade9ba",
        version: "2.0",
      });
      
      AMapRef.current = AMap;
      mapRef.current = new AMap.Map("map", {
        viewMode: "3D",
        zoom: 17,
      });

      // 添加标准控件
      AMap.plugin(
        ["AMap.ToolBar", "AMap.Scale", "AMap.MapType"],
        function () {
          const mapType = new AMap.MapType({
            defaultType: 0, // 使用2D
          });
          mapRef.current?.addControl(mapType);

          const tool = new AMap.ToolBar();
          mapRef.current?.addControl(tool);
          const scale = new AMap.Scale();
          mapRef.current?.addControl(scale);
        }
      );

      setIsMapLoaded(true);
      
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
    } catch (error) {
      console.error('地图加载失败:', error);
      return () => {};
    }
  }, []);

  // 清除地图上的所有元素
  const clearMap = useCallback(() => {
    if (!mapRef.current) return;
    
    mapRef.current.clearMap();
    
    // 清除各种引用
    infoWindowsRef.current = [];
    polygonsRef.current = [];
    polylinesRef.current = [];
    markersRef.current = [];
    
    // 关闭所有编辑器
    editorsRef.current.forEach((editor) => {
      if (editor) editor.close();
    });
    editorsRef.current = [];
    activeEditorRef.current = -1;
  }, []);

  // 绘制区域边界
  const drawAreaPolygon = useCallback((path: AMap.LngLat[]) => {
    if (!mapRef.current || !AMapRef.current || !path || path.length <= 0) return;

    const polygon = new AMapRef.current.Polygon();
    polygon.setPath(path);
    polygon.setOptions({
      strokeColor: "#3366FF",
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: "#3366FF",
      fillOpacity: 0.3,
    });

    mapRef.current.add(polygon);
    mapRef.current.setFitView([polygon]);
    
    return polygon;
  }, []);

  // 绘制航线区域和路径
  const drawWaylines = useCallback(
    (
      waylineAreas: WaylineAreaState[], 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      drones: any[], // 使用更具体的类型
      isEditMode: boolean,
      onPolygonEdit?: (index: number, newPath: AMap.LngLat[]) => void
    ) => {
      if (!mapRef.current || !AMapRef.current || !isMapLoaded) return;

      const currentMap = mapRef.current;
      const currentAMap = AMapRef.current;
      
      // 创建新的数组引用
      const newPolygons: AMap.Polygon[] = [];
      const newPolylines: AMap.Polyline[] = [];
      const newInfoWindows: AMap.InfoWindow[] = [];
      const newEditors: AMap.PolygonEditor[] = [];
      const newMarkers: AMap.Marker[][] = [];
      
      console.log("开始绘制航线区域", waylineAreas.length);
      
      waylineAreas.forEach((wayline, i) => {
        if (!wayline.visible) return;
        
        const drone = drones.find(d => d.key === wayline.droneKey) || {
          color: wayline.color || "#FF0000",
          name: "未知无人机",
        };

        // 创建子区域多边形
        const subPolygon = new currentAMap.Polygon();
        subPolygon.setPath(wayline.path);
        subPolygon.setOptions({
          strokeColor: drone.color,
          strokeWeight: 2,
          strokeOpacity: 1,
          fillColor: drone.color,
          fillOpacity: 0.3,
        });

        newPolygons.push(subPolygon);
        currentMap.add(subPolygon);

        // 如果有飞行路径点，绘制为折线
        if (wayline.points && wayline.points.length > 0) {
          // 创建折线
          const polyline = new currentAMap.Polyline({
            path: wayline.points,
            strokeColor: drone.color,
            strokeWeight: 4,
            strokeOpacity: 0.9,
            strokeStyle: "solid",
            strokeDasharray: [10, 5],
            lineJoin: "round",
            lineCap: "round",
            showDir: true,
          });
          
          newPolylines.push(polyline);
          currentMap.add(polyline);

          // 在每个转折点添加圆形标记
          const waypointMarkers: AMap.Marker[] = [];
          
          wayline.points.forEach((point, pointIndex) => {
            const marker = new currentAMap.Marker({
              position: point,
              offset: new currentAMap.Pixel(-8, -8),
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
                ${wayline.gimbalPitch ? `<p>云台俯仰角: ${wayline.gimbalPitch}°</p>` : ''}
                ${wayline.gimbalZoom ? `<p>云台变焦: ${wayline.gimbalZoom}x</p>` : ''}
              </div>`,
              offset: new currentAMap.Pixel(0, -20),
            });

            currentAMap.Event.addListener(marker, "mouseover", () => {
              markerInfo.open(currentMap, [point.getLng(), point.getLat()]);
            });

            currentAMap.Event.addListener(marker, "mouseout", () => {
              markerInfo.close();
            });

            waypointMarkers.push(marker);
            currentMap.add(marker);
          });
          
          newMarkers.push(waypointMarkers);
        }

        // 创建信息窗口但不立即打开
        const infoWindow = new currentAMap.InfoWindow({
          content: `<div>${drone.name}</div>`,
          offset: new currentAMap.Pixel(0, -25),
          isCustom: false,
        });
        newInfoWindows.push(infoWindow);

        // 点击时显示信息窗口和开启编辑
        const polygonIndex = i;
        currentAMap.Event.addListener(subPolygon, "click", () => {
          console.log(`点击了多边形 ${polygonIndex}`);
          
          // 关闭所有信息窗口
          currentMap.clearInfoWindow();

          // 计算中心点并打开信息窗口
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

          // 仅在编辑模式下处理编辑器
          if (isEditMode) {
            // 关闭之前活动的编辑器
            if (activeEditorRef.current !== -1 && newEditors[activeEditorRef.current]) {
              newEditors[activeEditorRef.current].close();
            }

            // 打开当前编辑器
            if (newEditors[polygonIndex]) {
              newEditors[polygonIndex].open();
              activeEditorRef.current = polygonIndex;
            }
          }
        });

        // 创建编辑器
        if (isEditMode) {
          currentAMap.plugin(["AMap.PolygonEditor"], () => {
            const polygonEditor = new currentAMap.PolygonEditor(
              currentMap,
              subPolygon
            );
            newEditors.push(polygonEditor);

            // 使用防抖处理编辑结束事件
            let lastUpdateTime = Date.now();
            let lastPathString = JSON.stringify(subPolygon.getPath());

            // 监听编辑结束事件，更新路径
            currentAMap.Event.addListener(polygonEditor, "end", () => {
              const newPath = subPolygon.getPath();
              if (!newPath) return;

              // 将路径转换为字符串以便比较
              const newPathString = JSON.stringify(newPath);
              const currentTime = Date.now();

              if (
                newPathString !== lastPathString &&
                currentTime - lastUpdateTime > 300 &&
                onPolygonEdit
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
                  
                // 调用回调通知外部状态更新
                onPolygonEdit(polygonIndex, safeNewPath);
              }
            });
          });
        }
      });

      // 更新引用
      polygonsRef.current = newPolygons;
      polylinesRef.current = newPolylines;
      infoWindowsRef.current = newInfoWindows;
      editorsRef.current = newEditors;
      markersRef.current = newMarkers;
      
      // 适应视图
      if (newPolygons.length > 0) {
        currentMap.setFitView();
      }
      
      // 返回清理函数
      return () => {
        newEditors.forEach((editor) => {
          if (editor) editor.close();
        });
        activeEditorRef.current = -1;
      };
    },
    [isMapLoaded]
  );

  // 初始化地图
  useEffect(() => {
    // 创建一个清理函数引用
    let cleanupFunction: (() => void) | undefined;
    
    // 调用初始化函数并处理返回的Promise
    initMap().then((cleanup) => {
      cleanupFunction = cleanup;
    }).catch((error) => {
      console.error('初始化地图失败:', error);
    });
    
    // 返回清理函数
    return () => {
      if (cleanupFunction) cleanupFunction();
    };
  }, [initMap]);

  return {
    AMapRef,
    mapRef,
    isMapLoaded,
    clearMap,
    drawAreaPolygon,
    drawWaylines,
  };
}

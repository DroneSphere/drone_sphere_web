"use client";

import {
  createArea,
  CreateAreaRequest,
  PointResult,
} from "@/api/search_area/search_area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

export default function AreaDetailPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const mapRef = useRef<AMap.Map | null>(null);
  const mouseToolRef = useRef<AMap.MouseTool | null>(null);
  const [path, setPath] = useState<AMap.LngLat[] | null>(null);
  const polygonEditorRef = useRef<AMap.PolygonEditor | null>(null);

  useEffect(() => {
    window._AMapSecurityConfig = {
      securityJsCode: "4ef657a379f13efbbf096baf8b08b3ed",
    };
    AMapLoader.load({
      key: "82ea7ca3d47546f079185e7ccdade9ba", // 申请好的Web端开发者Key，首次调用 load 时必填
      version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
    })
      .then((AMap) => {
        mapRef.current = new AMap.Map("map", {
          viewMode: "2D", // 是否为3D地图模式
          zoom: 17, // 初始化地图级别
        });

        AMap.plugin(
          [
            "AMap.ToolBar",
            "AMap.Scale",
            "AMap.MouseTool",
            "AMap.PolygonEditor",
          ],
          function () {
            const tool = new AMap.ToolBar();
            mapRef.current?.addControl(tool);

            const scale = new AMap.Scale();
            mapRef.current?.addControl(scale);

            const mouseTool = new AMap.MouseTool(mapRef.current);
            mouseToolRef.current = mouseTool;
            // @ts-expect-error 无法正确推断
            mouseTool.on("draw", (event) => {
              // @ts-expect-error 无法正确推断
              const p = event.obj.getPath().map((item) => {
                return new AMap.LngLat(item.lng, item.lat);
              });
              // 对 path 进行排序，按照经纬度排序
              // @ts-expect-error 无法正确推断
              p.sort((a, b) => {
                if (a.getLng() === b.getLng()) {
                  return a.getLat() - b.getLat();
                }
                return a.getLng() - b.getLng();
              });
              setPath(p);
            });
            mapRef.current?.addControl(mouseTool);

            const polygonEditor = new AMap.PolygonEditor(mapRef.current);
            polygonEditorRef.current = polygonEditor;
          }
        );

        AMap.plugin("AMap.Geolocation", function () {
          const geolocation = new AMap.Geolocation({
            enableHighAccuracy: true, // 是否使用高精度定位，默认：true
            timeout: 10000, // 设置定位超时时间，默认：无穷大
            offset: [64, 20], // 定位按钮的停靠位置的偏移量
            zoomToAccuracy: true, //  定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
            position: "RB", //  定位按钮的排放位置,  RB表示右下
          });

          // @ts-expect-error 无法正确推断
          geolocation.getCurrentPosition(function (status, result) {
            if (status == "complete") {
              console.log(result);
            } else {
              console.log(result);
            }
          });
          mapRef.current?.addControl(geolocation);
        });
      })
      .catch((e) => {
        console.log(e);
      });

    return () => {
      mapRef.current?.destroy();
    };
  }, []);

  const mutation = useMutation({
    mutationFn: createArea,
    onSuccess: () => {
      console.log("创建成功");
      toast({
        title: "创建成功",
        description: "创建成功",
      });
    },
  });

  const handleSubmit = () => {
    const points = path?.map((point, index) => {
      return {
        index: index,
        lat: point.getLat(),
        lng: point.getLng(),
      } as PointResult;
    });
    const req = {
      name: name,
      points: points,
    } as CreateAreaRequest;
    mutation.mutate(req);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex space-x-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="name">名称</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入名称"
            className="max-w-md"
          />
        </div>
        <div className="flex-auto"></div>
        <Button
          variant="outline"
          disabled={path !== null}
          onClick={() => {
            mouseToolRef.current?.polygon({
              strokeColor: "#FF33FF", //轮廓线颜色
              strokeWeight: 6, //轮廓线宽度
              strokeOpacity: 0.2, //轮廓线透明度
              fillColor: "#1791fc", //多边形填充颜色
              fillOpacity: 0.4, //多边形填充透明度
              strokeStyle: "solid", //线样式还支持 'dashed'
            });
          }}
        >
          绘制区域
        </Button>
        <Button
          variant="outline"
          disabled={path === null || path?.length <= 0}
          onClick={() => {
            mouseToolRef.current?.close(true);
            setPath(null);
          }}
        >
          清空
        </Button>
        <Button
          disabled={path === null || path?.length <= 0 || mutation.isPending}
          onClick={handleSubmit}
        >
          保存
        </Button>
      </div>
      {/* <div>{data?.description}</div> */}
      <div className="flex space-x-4">
        <div
          id="map"
          className="h-[520px] w-full border rounded-md shadow-sm"
        ></div>
        {path && (
          <div className="p-4 space-y-2 border rounded-md shadow-sm">
            <div className="flex justify-around gap-4">
              <div>经度</div>
              <div>纬度</div>
            </div>
            {path?.map((point, index) => (
              <div key={index} className="flex justify-around gap-4">
                <div>{point.getLng().toFixed(6)}</div>
                <div>{point.getLat().toFixed(6)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

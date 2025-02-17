"use client";

import { fetchArea } from "@/api/search_area/search_area";
import { Button } from "@/components/ui/button";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function AreaDetailPage() {
  const mapRef = useRef<AMap.Map | null>(null);
  const pathname = usePathname();

  const query = useQuery({
    queryKey: ["areas", pathname.split("/")[3]],
    queryFn: () => {
      return fetchArea({
        id: Number(pathname.split("/")[3]),
      });
    },
  });

  useEffect(() => {
    if (query.data) {
      if (query.data.points) {
        const path = query.data.points.map(
          (point) => new AMap.LngLat(point.lng!, point.lat!)
        );
        const polygon = new AMap.Polygon();
        polygon.setPath(path);

        //鼠标移入事件
        polygon.on("mouseover", () => {
          polygon.setOptions({
            //修改多边形属性的方法
            fillOpacity: 0.7, //多边形填充透明度
            fillColor: "#7bccc4",
          });
        });
        //鼠标移出事件
        polygon.on("mouseout", () => {
          polygon.setOptions({
            fillOpacity: 1,
            fillColor: "#fff",
          });
        });
        mapRef.current?.add(polygon);

        const markers = query.data.points.map((point) => {
          const m = new AMap.Marker({
            position: new AMap.LngLat(point.lng!, point.lat!),
          });
          return m;
        });
        mapRef.current?.add(markers);

        mapRef.current?.setFitView([polygon]);
      }
    }
  }, [query.data]);

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
          ["AMap.ToolBar", "AMap.Scale", "AMap.PolygonEditor"],
          function () {
            const tool = new AMap.ToolBar();
            mapRef.current?.addControl(tool);

            const scale = new AMap.Scale();
            mapRef.current?.addControl(scale);
          }
        );
      })
      .catch((e) => {
        console.log(e);
      });

    return () => {
      mapRef.current?.destroy();
    };
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex space-x-4 items-end">
        <div className="text-2xl font-semibold">{query.data?.name}</div>
        <div className="flex-auto"></div>
        <Button variant="destructive">删除</Button>
      </div>
      <div className="flex space-x-4">
        <div
          id="map"
          className="h-[600px] w-full border rounded-md shadow-sm"
        ></div>
        {query.data?.points && (
          <div className="flex flex-col">
            <div className="p-4 space-y-2 border rounded-md shadow-sm">
              <div className="flex justify-around gap-4">
                <div>经度</div>
                <div>纬度</div>
              </div>
              {query.data?.points.map((point, index) => (
                <div key={index} className="flex justify-around gap-4">
                  <div>{point.lng!.toFixed(6)}</div>
                  <div>{point.lat!.toFixed(6)}</div>
                </div>
              ))}
            </div>
            <div className="flex-auto"></div>
            <div>面积: </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { fetchArea } from "@/api/search_area/search_area";
import { Button } from "@/components/ui/button";
import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function AreaDetailPage() {
  const AMapRef = useRef<typeof AMap | null>(null);
  const mapRef = useRef<AMap.Map | null>(null);
  const [amapLoaded, setAmapLoaded] = useState(false);
  const pathname = usePathname();

  const query = useQuery({
    queryKey: ["areas", pathname.split("/")[2]],
    queryFn: () => {
      return fetchArea({
        id: Number(pathname.split("/")[2]),
      });
    },
  });

  useEffect(() => {
    if (query.data?.points && amapLoaded && AMapRef.current) {
      const path = query.data.points.map(
        (point) => new AMapRef.current!.LngLat(point.lng!, point.lat!)
      );

      const polygon = new AMapRef.current!.Polygon();
      polygon.setPath(path);
      polygon.setOptions({
        strokeColor: "#6699FF", //线颜色
        strokeOpacity: 0.8, //线透明度
        strokeWeight: 2, //线粗细度
        fillColor: "#66CCFF", //填充色
        fillOpacity: 0.4, //填充透明度
      });
      // 添加鼠标移入移出修改fillOpacity的事件
      polygon.on("mouseover", function () {
        polygon.setOptions({
          fillOpacity: 0.2,
        });
      });
      polygon.on("mouseout", function () {
        polygon.setOptions({
          fillOpacity: 0.4,
        });
      });

      polygon.setMap(mapRef.current);
      mapRef.current?.setFitView([polygon]);

      return () => {
        polygon.setMap(null);
      };
    }
  }, [query.data, amapLoaded]);

  useEffect(() => {
    window._AMapSecurityConfig = {
      securityJsCode: "4ef657a379f13efbbf096baf8b08b3ed",
    };
    AMapLoader.load({
      key: "82ea7ca3d47546f079185e7ccdade9ba", // 申请好的Web端开发者Key，首次调用 load 时必填
      version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
    })
      .then((AMap) => {
        AMapRef.current = AMap;
        console.log("AMap initialized");

        mapRef.current = new AMap.Map("map", {
          viewMode: "3D", // 是否为3D地图模式
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

        setAmapLoaded(true); // 更新加载状态
      })
      .catch((e) => {
        console.log(e);
      });

    return () => {
      mapRef.current?.destroy();
      setAmapLoaded(false); // 重置加载状态
    };
  }, []);

  return (
    <div className="px-4">
      <div className="flex space-x-4 items-end mb-4">
        <div>
          <div className="text-xl font-semibold">{query.data?.name}</div>
          <div className="text-sm text-gray-500">{query.data?.description}</div>
        </div>
        <div className="flex-auto"></div>
        <Button variant="destructive" size="sm">删除</Button>
      </div>
      <div className="flex space-x-4 mb-4">
        <div
          id="map"
          className="h-[calc(100vh-120px)] w-full border rounded-md shadow-sm"
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

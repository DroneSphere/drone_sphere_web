"use client";

import AMapLoader from "@amap/amap-jsapi-loader";
import "@amap/amap-jsapi-types";
import { useEffect, useRef } from "react";

export default function MapContainer() {
  const mapRef = useRef<AMap.Map | null>(null);

  useEffect(() => {
    window._AMapSecurityConfig = {
      securityJsCode: "4ef657a379f13efbbf096baf8b08b3ed",
    };

    AMapLoader.load({
      key: "82ea7ca3d47546f079185e7ccdade9ba", // 申请好的Web端开发者Key，首次调用 load 时必填
      version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
      plugins: [], // 需要使用的的插件列表，如比例尺'AMap.Scale'等
    })
      .then((AMap) => {
        mapRef.current = new AMap.Map("container", {
          // 设置地图容器id
          viewMode: "3D", // 是否为3D地图模式
          zoom: 11, // 初始化地图级别
          center: [116.397428, 39.90923], // 初始化地图中心点位置
        });
      })
      .catch((e) => {
        console.log(e);
      });

    return () => {
      mapRef.current?.destroy();
    };
  }, []);

  return <div id="container" style={{ height: "800px" }}></div>;
}

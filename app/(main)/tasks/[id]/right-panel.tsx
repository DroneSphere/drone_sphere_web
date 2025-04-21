"use client";

import { DroneState } from "@/app/(main)/drones/types";
import { baseURL } from "@/api/http_client";
import React, { useEffect, useState } from "react";
import { SearchResultItem } from "./type";
import { getSearchResults } from "./request";
import DroneCardList from "./drone-card-list";
import SearchResultList from "./search-result-list";
import { DroneData } from "./types";

interface DroneMonitorPanelProps {
  drones?: DroneData[];
  mapRef: React.MutableRefObject<AMap.Map | null>;
  AMapRef: React.MutableRefObject<typeof AMap | null>;
}

export default function DroneMonitorPanel({
  drones,
  mapRef,
  AMapRef,
}: DroneMonitorPanelProps) {
  const [droneStates, setDroneStates] = useState<Record<string, DroneState>>(
    {}
  );
  const [droneMarkers, setDroneMarkers] = useState<
    Record<string, AMap.Marker | undefined>
  >({});
  const [droneConnections, setDroneConnections] = useState<
    Record<string, boolean>
  >({});
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);

  // 添加一个ref来保存EventSource实例，防止重复创建
  const eventSourcesRef = React.useRef<Record<string, EventSource>>({});

  // SSE处理逻辑
  useEffect(() => {
    if (!drones) return;

    // 初始化连接状态，但不要覆盖已有的连接
    setDroneConnections((prev) => {
      const updatedConnections = { ...prev };
      drones.forEach((drone) => {
        if (drone.sn && updatedConnections[drone.sn] === undefined) {
          updatedConnections[drone.sn] = false;
        }
      });
      return updatedConnections;
    });

    // 创建和保存所有要使用的EventSource
    drones.forEach((drone) => {
      if (!drone.sn) return;

      // 如果已经有连接，不要重复创建
      if (eventSourcesRef.current[drone.sn]) {
        return;
      }

      const droneSN = drone.sn;
      const sseUrl = `${baseURL}/drone/state/sse?sn=${droneSN}`;

      const source = new EventSource(sseUrl);
      eventSourcesRef.current[droneSN] = source;

      // 连接成功时更新连接状态
      source.onopen = () => {
        setDroneConnections((prev) => ({
          ...prev,
          [droneSN]: true,
        }));
      };

      source.onmessage = (event) => {
        try {
          const newState: DroneState = JSON.parse(event.data);

          setDroneStates((prev) => ({
            ...prev,
            [droneSN]: newState,
          }));

          setDroneConnections((prev) => ({
            ...prev,
            [droneSN]: true,
          }));
        } catch (error) {
          console.error(`Error processing message for ${droneSN}:`, error);
        }
      };

      source.onerror = () => {
        setDroneConnections((prev) => ({
          ...prev,
          [droneSN]: false,
        }));
      };
    });

    const currentEventSources = eventSourcesRef.current;
    return () => {
      Object.keys(currentEventSources).forEach((key) => {
        currentEventSources[key]?.close();
        delete currentEventSources[key];
      });
    };
  }, [drones]);

  // 地图标记更新逻辑
  useEffect(() => {
    if (!AMapRef.current || !mapRef.current) return;

    Object.entries(droneStates).forEach(([droneSN, state]) => {
      const drone = drones?.find((d) => d.sn === droneSN);
      if (!drone) return;

      const lng = state.lng;
      const lat = state.lat;
      const droneColor = drone.color || "#3366FF";
      const markerContent = `
        <div style="position: relative;">
          <div style="
            width: 28px; 
            height: 28px; 
            background-color: ${droneColor}; 
            border-radius: 50%; 
            border: 2px solid white;
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: 0 3px 6px rgba(0,0,0,0.3);
            transform: rotate(${state.heading || 0}deg);
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"></path>
            </svg>
          </div>
          <div style="
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0,0,0,0.7);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            white-space: nowrap;
          ">${drone.callsign || droneSN}</div>
        </div>
      `;

      const existingMarker = droneMarkers[droneSN];

      if (existingMarker) {
        existingMarker.setPosition([lng, lat]);
        existingMarker.setContent(markerContent);
      } else {
        try {
          const marker = new AMapRef.current!.Marker({
            position: new AMapRef.current!.LngLat(lng, lat),
            title: drone.callsign || droneSN,
            content: markerContent,
            anchor: "center",
            zIndex: 100,
          });

          mapRef.current!.add(marker);

          setDroneMarkers((prev) => ({
            ...prev,
            [droneSN]: marker,
          }));
        } catch (error) {
          console.error(`Error creating marker for drone ${droneSN}:`, error);
        }
      }
    });

    Object.entries(droneMarkers).forEach(([sn, marker]) => {
      if (!droneStates[sn] && marker) {
        mapRef.current?.remove(marker);
        setDroneMarkers((prev) => {
          const updated = { ...prev };
          delete updated[sn];
          return updated;
        });
      }
    });
  }, [droneStates, drones, AMapRef, mapRef, droneMarkers]);

  // 搜索结果轮询逻辑
  useEffect(() => {
    const jobId = "9";
    const intervalId = setInterval(async () => {
      try {
        const result = await getSearchResults(jobId);
        setSearchResults(result.data.items);
      } catch (error) {
        console.error("获取搜索结果失败:", error);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // 处理搜索结果点击
  const handleSearchResultClick = (result: SearchResultItem) => {
    if (!mapRef.current) return;

    // 将地图中心设置为搜索结果的位置
    mapRef.current.setCenter([Number(result.lng), Number(result.lat)]);
    mapRef.current.setZoom(18);
  };

  return (
    <div className="flex flex-col gap-4 w-96 max-h-[calc(100vh-4rem)]">
      {/* 实时数据区域 */}
      <div className="flex-1 h-auto overflow-y-auto">
        <DroneCardList
          drones={drones}
          droneStates={droneStates}
          droneConnections={droneConnections}
        />
      </div>

      {/* 搜索结果区域 */}
      <div className="h-[300px] overflow-y-auto">
        <SearchResultList
          searchResults={searchResults}
          onResultClick={handleSearchResultClick}
        />
      </div>
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { VideoPlayer } from "@/components/video/video-player";
import { WebRTCPlayer } from "@/components/video/webrtc";

interface ControlledVideoPlayerProps {
  videoUrl: string;
  width?: number;
  height?: number;
  type?: "hls" | "webrtc"; // 可选类型，默认为 hls
  controls?: boolean; // 是否显示控制条
}

export function ControlledVideoPlayer({
  videoUrl,
  width = 480,
  height = 640,
  type = "hls",
  controls = false,
}: ControlledVideoPlayerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const positionRef = useRef(position);
  const scaleRef = useRef(scale);

  // 同步ref和state
  useEffect(() => {
    positionRef.current = position;
    scaleRef.current = scale;
  }, [position, scale]);

  // 拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    if (controls) return; // 控制条显示时禁止拖拽
    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };
  };

  // 拖拽中
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || controls) return;
    const newX = e.clientX - dragStartPos.current.x;
    const newY = e.clientY - dragStartPos.current.y;
    // 限制边界
    const scaledWidth = width * scaleRef.current;
    const scaledHeight = height * scaleRef.current;
    const minX = Math.min(0, width - scaledWidth);
    const minY = Math.min(0, height - scaledHeight);
    const maxX = 0;
    const maxY = 0;
    setPosition({
      x: Math.max(minX, Math.min(newX, maxX)),
      y: Math.max(minY, Math.min(newY, maxY)),
    });
  };

  // 拖拽结束
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 缩放处理
  const handleWheel = (e: React.WheelEvent) => {
    if (controls) return; // 控制条显示时禁止缩放
    e.preventDefault();
    const zoomIntensity = 0.001;
    const newScale = Math.min(
      Math.max(1, scaleRef.current - e.deltaY * zoomIntensity), // 最小为1
      2
    );
    setScale(newScale);
  };

  // 添加/移除全局鼠标事件
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ width, height }}
    >
      <div
        className="absolute cursor-move touch-none"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: "top left",
          width,
          height
        }}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
{/* 根据类型选择播放器 */}
        {type === "hls"?<VideoPlayer
          videoUrl={videoUrl}
          width={width}
          height={height}
          controls={controls}
        />:<WebRTCPlayer
        streamUrl={videoUrl}
          width={width}
          height={height}
          controls={controls}
        />}
        
      </div>
    </div>
  );
}
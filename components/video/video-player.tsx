"use client";

import { useRef, useEffect, useState } from "react";

// HLS.js 动态导入，避免 SSR 问题
// TIP:目前这个项目计划使用webrtc来代替hls.js进行播放，这个组件只作保留
import type { ErrorData } from "hls.js";
let Hls: typeof import("hls.js")['default'] | null = null;
if (typeof window !== "undefined") {
  import("hls.js").then((module) => {
    Hls = module.default;
  });
}

type VideoPlayerProps = {
  videoUrl: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  controls?: boolean;
};

export function VideoPlayer({
  videoUrl,
  height = 480,
  width = 640,
  style,
  controls = false
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<InstanceType<typeof import("hls.js")['default']> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化播放器
  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;

    const video = videoRef.current;
    let hls: InstanceType<typeof import("hls.js")['default']> | null = null;

    const initPlayer = async () => {
      try {
        // 等待 HLS.js 加载完成
        if (!Hls) {
          const hlsModule = await import("hls.js");
          Hls = hlsModule.default;
        }

        // 检查 HLS 原生支持
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari 原生支持
          video.src = videoUrl;
          setIsReady(true);
        } 
        // 使用 HLS.js
        else if (Hls && Hls.isSupported()) {
          // 清理之前的实例
          if (hlsRef.current) {
            hlsRef.current.destroy();
          }

          hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 120, // 增大回退缓冲
            maxBufferLength: 10,   // 缓冲区小一点，减少延迟
            maxMaxBufferLength: 20,
            liveSyncDurationCount: 2,
            liveMaxLatencyDurationCount: 5,
            maxLiveSyncPlaybackRate: 1.5, // 追帧
          });

          hlsRef.current = hls;

          // 监听关键事件
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log("HLS manifest parsed, starting playback");
            setIsReady(true);
            // 强制最低画质
            hls!.currentLevel = 0;
            // 自动播放
            video.play().catch(console.error);
          });

          hls.on(Hls.Events.ERROR, (_: unknown, data: ErrorData) => {
            console.error("HLS Error:", data);
            if (data && typeof data === "object" && "fatal" in data && data.fatal) {
              switch (data.type) {
                case Hls && Hls.ErrorTypes.NETWORK_ERROR:
                  console.log("Network error, trying to recover...");
                  hls!.startLoad();
                  break;
                case Hls && Hls.ErrorTypes.MEDIA_ERROR:
                  console.log("Media error, trying to recover...");
                  hls!.recoverMediaError();
                  break;
                default:
                  console.error("Fatal error, destroying HLS instance");
                  hls!.destroy();
                  break;
              }
            }
          });

          // 加载流
          hls.loadSource(videoUrl);
          hls.attachMedia(video);

        } else {
          console.error("HLS is not supported in this browser");
        }

      } catch (error) {
        console.error("Failed to initialize player:", error);
      }
    };

    // 延迟初始化，确保组件完全挂载
    const timer = setTimeout(initPlayer, 100);

    return () => {
      clearTimeout(timer);
      if (hls) {
        hls.destroy();
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl]);

  // 视频事件监听
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      setIsLoading(true);
    };
    const handleCanPlay = () => {
      setIsLoading(false);
    };
    const handlePlay = () => {
      setIsLoading(false);
    };
    const handleWaiting = () => {
      setIsLoading(true);
    };
    const handlePlaying = () => {
      setIsLoading(false);
    };
    const handleError = () => {
      setIsLoading(true);
    };

    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("play", handlePlay);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("error", handleError);
    };
  }, []);

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: "relative",
        backgroundColor: "#000",
        ...style,
      }}
    >
      <video
        ref={videoRef}
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
        playsInline
        muted={false}
        autoPlay
        preload="none"
        controls={controls}
      >
        <p>您的浏览器不支持 HTML5 视频，请升级浏览器</p>
      </video>
      {(isLoading || !isReady) && !controls && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "white",
            fontSize: "14px",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div className="animate-spin border-4 border-gray-300 border-t-blue-500 rounded-full w-10 h-10 mb-2" />
          <span>加载中...</span>
        </div>
      )}
    </div>
  );
}
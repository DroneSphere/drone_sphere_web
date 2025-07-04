"use client"
import { useEffect, useRef, useState } from "react";
import { SrsRtcWhipWhepAsync } from "@/public/js/srs.sdk";

type VideoPlayerProps = {
    streamUrl: string;
    width?: number;
    height?: number;
    controls?: boolean;
};

export function WebRTCPlayer({
    streamUrl,
    height = 480,
    width = 640,
    controls = false
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const sdkRef = useRef<ReturnType<typeof SrsRtcWhipWhepAsync> | null>(null); // 明确类型
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // let stopped = false; // 移除未用变量
        const timeoutId: ReturnType<typeof setTimeout> | null = null;

        async function startSrsWebRTC() {
            // 关闭上一个 sdk 实例
            if (sdkRef.current) {
                sdkRef.current.close();
                sdkRef.current = null;
            }
            if (streamUrl.includes("/whep/")) {
                if (!SrsRtcWhipWhepAsync) return;
                setLoading(true);
                const sdk = SrsRtcWhipWhepAsync();
                sdkRef.current = sdk;
                if (videoRef.current) {
                    videoRef.current.srcObject = sdk.stream;
                }
                try {
                    await sdk.play(streamUrl, {}); // session 未用，直接省略
                    // 拉流成功，等待 canplay 事件
                } catch (e) {
                    sdk.close();
                    sdkRef.current = null;
                    if (videoRef.current) videoRef.current.srcObject = null;
                    setLoading(false);
                    console.error("Failed to play WHEP stream:", e);
                }
            }
        }
        startSrsWebRTC();
        return () => {
            if (sdkRef.current) {
                sdkRef.current.close();
                sdkRef.current = null;
            }
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [streamUrl]);

    // 监听 canplay 事件，流可用时隐藏 loading
    useEffect(() => {
        const videoEl = videoRef.current; // 先保存引用，清理时用
        if (!videoEl) return;
        const handler = () => setLoading(false);
        videoEl.addEventListener('canplay', handler);
        return () => {
            videoEl.removeEventListener('canplay', handler);
        };
    }, [streamUrl]);

    return (
        <div style={{ position: 'relative', width, height }}>
            {!controls && loading && (
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
            <video
                ref={videoRef}
                width={width}
                height={height}
                style={{ width, height, background: "#000" }}
                autoPlay
                playsInline
                controls={controls}
                muted
            />
        </div>
    );
}
import React, { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Slider } from "./slider";
import { RefreshCcwDot } from "lucide-react";
import { Camera } from "@/app/(main)/jobs/[id]/job-state";

type Direction = "up" | "down" | "left" | "right" | "left-up" | "left-down" | "right-up" | "right-down";

function generateUUID() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  } else {
    // 降级方案：生成一个伪随机 UUID
    // 这是一个简化版本，不完全符合 UUID v4 规范，但对于许多情况已经足够
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
interface GimbalControlProps {
    className?: string;
    physicalDroneSn?: string;
    cameras?: Camera[];
    layout?: "horizontal" | "vertical";
}
//TODO: 看看有没有机会实现一下上下限的维护
export function DirectionsScaleControl({
    className,
    physicalDroneSn,
    cameras,
    layout = "horizontal"
}: GimbalControlProps) {
    // 云台状态
    const [prevZoom, setPrevZoom] = useState(2);
    const [prevPitch, setPrevPitch] = useState(0);
    const [prevYaw, setPrevYaw] = useState(0);
    const [pitch, setPitch] = useState(0); 
    const [yaw, setYaw] = useState(0);
    const [zoom, setZoom] = useState(2);
    const [cameraType, setCameraType] = useState("zoom")
    const [currentCamera, setCurrentCamera] = useState<Camera|null>(null)
    
    const pitchRef = useRef(pitch)
    const yawRef =  useRef(yaw)
    const prevPitchRef = useRef(prevPitch)
    const prevYawRef = useRef(prevYaw)
    const zoomRef = useRef(zoom)
    const prevZoomRef = useRef(prevZoom);
    // 交互状态
    const [activeDir, setActiveDir] = useState<Direction | null>(null);

    // 控制参数
    const containerRef = useRef<HTMLDivElement>(null);
    const pressedKeysRef = useRef<Set<string>>(new Set());
    const intervalRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const isMouseDownRef = useRef<boolean>(false);
    const currentDirectionRef = useRef<Direction | null>(null); // 添加当前方向引用
    const webSocketRef = useRef<WebSocket | null>(null);

    // 键盘方向与方向名映射
    const keyToDir: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
    };

    // 组合键映射
    function getComboDirection(keys: Set<string>): Direction | null {
        const up = keys.has("ArrowUp");
        const down = keys.has("ArrowDown");
        const left = keys.has("ArrowLeft");
        const right = keys.has("ArrowRight");

        // 相反方向同时按下时不触发
        if ((up && down) || (left && right)) return null;

        // 组合方向优先
        if (up && left) return "left-up";
        if (up && right) return "right-up";
        if (down && left) return "left-down";
        if (down && right) return "right-down";

        // 单一方向
        if (up) return "up";
        if (down) return "down";
        if (left) return "left";
        if (right) return "right";

        return null;
    }

    // 计算加速度的移动步长
    const calculateStep = useCallback((elapsedTime: number) => {
        const baseSpeed = 0.25;
        const acceleration = 0.0005;
        const maxSpeed = 2;

        const speed = Math.min(maxSpeed, baseSpeed + acceleration * elapsedTime);
        return speed;
    }, []);

    // 根据方向更新云台角度
    const updateGimbalPosition = useCallback((direction: Direction, step: number) => {
        setPitch(prevPitch => {
            let newPitch = prevPitch;

            switch (direction) {
                case "up":
                case "left-up":
                case "right-up":
                    newPitch = prevPitch + step * (direction.includes('-') ? 0.7 : 1);
                    break;
                case "down":
                case "left-down":
                case "right-down":
                    newPitch =  prevPitch - step * (direction.includes('-') ? 0.7 : 1);
                    break;
            }

            return newPitch;
        });

        setYaw(prevYaw => {
            let newYaw = prevYaw;

            switch (direction) {
                case "left":
                case "left-up":
                case "left-down":
                    newYaw = prevYaw - step * (direction.includes('-') ? 0.7 : 1);
                    break;
                case "right":
                case "right-up":
                case "right-down":
                    newYaw = prevYaw + step * (direction.includes('-') ? 0.7 : 1);
                    break;
            }

            return newYaw;
        });
    }, []);

    // 开始持续移动
    const startContinuousMove = useCallback((direction: Direction) => {
        // 清除之前的定时器
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        setActiveDir(direction);
        currentDirectionRef.current = direction; // 更新当前方向
        startTimeRef.current = Date.now();

        // 使用 setInterval 实现持续移动，调整更新频率
        intervalRef.current = window.setInterval(() => {
            const elapsedTime = Date.now() - startTimeRef.current;
            const step = calculateStep(elapsedTime);
            updateGimbalPosition(direction, step);
        }, 50); // 从16ms改为50ms，降低更新频率让移动更平滑缓慢
    }, [calculateStep, updateGimbalPosition]);

    // 停止持续移动
    const stopContinuousMove = useCallback(() => {
        setActiveDir(null);
        currentDirectionRef.current = null; // 清空当前方向
        startTimeRef.current = 0;
        isMouseDownRef.current = false;

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // 键盘事件处理
    useEffect(() => {
        function triggerDirection() {
            const dir = getComboDirection(pressedKeysRef.current);

            // 只有当方向发生变化时才重新触发
            if (dir !== currentDirectionRef.current) {
                if (dir) {
                    startContinuousMove(dir);
                } else {
                    stopContinuousMove();
                }
            }
        }

        function handleKeyDown(e: KeyboardEvent) {
            // 处理方向键
            if (keyToDir[e.key]) {
                e.preventDefault();
                pressedKeysRef.current.add(e.key);
                triggerDirection();
                return;
            }

            // 处理缩放键 - 调整缩放步长
            console.log(currentCamera?.is_zoomable)
            if(currentCamera?.is_zoomable){
                if (e.key === "+" || e.key === "=") {
                    e.preventDefault();
                    setZoom(s => Math.min(200, s + 0.5)); // 从1改为0.5，让缩放更细腻
                }
                if (e.key === "-" || e.key === "_") {
                    e.preventDefault();
                    setZoom(s => Math.max(1, s - 0.5)); // 从1改为0.5，让缩放更细腻
                }
            }
        }

        function handleKeyUp(e: KeyboardEvent) {
            if (keyToDir[e.key]) {
                e.preventDefault();
                pressedKeysRef.current.delete(e.key);
                triggerDirection();
            }
        }

        function handleBlur() {
            pressedKeysRef.current.clear();
            stopContinuousMove();
        }

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", handleBlur);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("blur", handleBlur);
        };
    }, [startContinuousMove, stopContinuousMove, currentCamera]);

    // 鼠标事件处理
    const handleMouseDown = useCallback((dir: Direction) => {
        isMouseDownRef.current = true;
        startContinuousMove(dir);
    }, [startContinuousMove]);

    const handleMouseUp = useCallback(() => {
        isMouseDownRef.current = false;
        // 如果没有键盘按键，则停止移动
        if (pressedKeysRef.current.size === 0) {
            stopContinuousMove();
        }
    }, [stopContinuousMove]);

    const handleMouseLeave = useCallback(() => {
        isMouseDownRef.current = false;
        // 如果没有键盘按键，则停止移动
        if (pressedKeysRef.current.size === 0) {
            stopContinuousMove();
        }
    }, [stopContinuousMove]);

    // 缩放控制
    const handleZoomChange = useCallback((newZoom: number) => {
        setZoom(newZoom);
    }, []);

    // 重置云台
    const handleReset = useCallback(() => {
        setPitch(-prevPitch);
        setYaw(-prevYaw);
        setZoom(2);
    }, [prevPitch, prevYaw]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isMouseDownRef.current) {
                handleMouseUp();
            }
        };

        document.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [handleMouseUp]);

    useEffect(()=>{
        const camera = cameras?.filter((item)=>item.type == cameraType)[0] || null
        console.log(camera)
        setCurrentCamera(camera)
    },[cameraType,cameras])
    
    useEffect(() => {
        zoomRef.current = zoom;
    }, [zoom]);

    useEffect(() => {
        pitchRef.current = pitch;
    }, [pitch]);

    useEffect(() => {
        yawRef.current = yaw;
    }, [yaw]);
    useEffect(() => {
        prevPitchRef.current = prevPitch;
    },[prevPitch])
    useEffect(() => {
        prevYawRef.current = prevYaw;
    },[prevYaw])
    useEffect(() => {
        prevZoomRef.current = prevZoom;
    }, [prevZoom]);


    //ws连接
    useEffect(() => {
        const connectSocket = async () => {
            try {
                const socket = new WebSocket(`ws://47.245.40.222:10089/api/v1/drone/${physicalDroneSn}/control`);
                socket.onopen = () => {
                    console.log('WebSocket connected');
                    webSocketRef.current = socket
                }
                socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // 验证消息类型
        if (message.method === 'init') {
          console.log('Received init message:', message);
        //   setYaw(message.data.yaw)
          setZoom(message.data.zoom)
        //   setPitch(message.data.pitch)
          setCameraType(message.data.current_camera)
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };
            } catch (error) {
                console.error('Socket 创建失败:', error);
            }
        };

        connectSocket();

        return () => {
            if (webSocketRef.current) {
                webSocketRef.current.close();
                webSocketRef.current = null;
            }
        };
    }, [physicalDroneSn]);

    useEffect(() => {
        const Timer = setInterval(() => {
            console.log("SocketRef:", webSocketRef.current);
            if (webSocketRef.current) {
                if(currentCamera?.is_zoomable && Math.abs(zoomRef.current - prevZoomRef.current) > 0.1){
                    console.log("zoom",zoomRef.current.toFixed(1));
                    webSocketRef.current.send(JSON.stringify({
                    "tid": generateUUID(),
                    "timestamp": Math.floor(Date.now() / 1000),
                    "method": "zoom",
                    "data": {
                        "factor": parseFloat(zoomRef.current.toFixed(1))
                    }
                }));
                setPrevZoom(zoomRef.current);
                }
                if(pitchRef.current - prevPitchRef.current !== 0 || yawRef.current - prevYawRef.current !== 0){
                    console.log("pitch",(pitchRef.current - prevPitchRef.current).toFixed(1),"yaw",(yawRef.current - prevYawRef.current).toFixed(1))
                    webSocketRef.current.send(JSON.stringify({
                    "tid": generateUUID(),
                    "timestamp": Math.floor(Date.now() / 1000),
                    "method": "set_gimbal_angle",
                    "data": {
                        "pitch": parseFloat((pitchRef.current - prevPitchRef.current).toFixed(1)),
                        "roll": 0,
                        "yaw": parseFloat((yawRef.current - prevYawRef.current).toFixed(1))
                    }
                }));
                setPrevPitch(pitchRef.current);
                setPrevYaw(yawRef.current);
                }
            }
        }, 1000);
        return () => {
            clearInterval(Timer);
        }
    }, [webSocketRef.current,currentCamera]);

    const handleCameraTypeChange = (newCameraType:string)=>{
        if(webSocketRef.current){
            setCameraType(newCameraType)
            webSocketRef.current.send(JSON.stringify({
                    "tid": generateUUID(),
                    "timestamp": Math.floor(Date.now() / 1000),
                    "method": "switch_camera",
                    "data": {
                        "camera": newCameraType
                    }
                }))
        }
    }

    // 根据布局属性确定容器样式
    const containerClasses = layout === "vertical" 
        ? "w-auto h-auto flex flex-col items-center justify-center gap-6" 
        : "w-auto h-40 flex flex-row items-center justify-between gap-6";

    return (
        <div ref={containerRef} className={cn(containerClasses, className)}>
            {/* 云台状态显示 */}
            <div className="flex flex-col items-center space-y-2">
                <div className="text-sm font-medium text-gray-700">云台状态</div>
                <div className="text-xs text-gray-500">
                    {cameras && 
                        <select
                        className="text-xs border rounded px-2 py-1 bg-white"
                        value={cameraType}
                        onChange={(e) => handleCameraTypeChange(e.target.value)}
                        aria-label="无人机相机选择"
                    >
                        {cameras?.map((camera) => (
                            <option key={camera.type} value={camera.type}>{camera.label}</option>
                        ))}
                    </select>
                    }
                </div>
            </div>

            {/* 方向控制器 */}
            <div
                className="relative h-40 bg-white shadow-lg aspect-square rounded-full flex items-center justify-center"
                onMouseLeave={handleMouseLeave}
            >
                <div className="w-[80%] h-[80%] relative">
                    {[
                        { dir: "up", deg: 0 },
                        { dir: "right-up", deg: 45 },
                        { dir: "right", deg: 90 },
                        { dir: "right-down", deg: 135 },
                        { dir: "down", deg: 180 },
                        { dir: "left-down", deg: 225 },
                        { dir: "left", deg: 270 },
                        { dir: "left-up", deg: 315 },
                    ].map(({ dir, deg }) => (
                        <button
                            key={dir}
                            type="button"
                            className={cn(
                                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center transition-colors select-none",
                                activeDir === dir ? "text-blue-500" : "bg-white text-black hover:text-blue-400",
                            )}
                            style={{
                                transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-60px)`,
                            }}
                            onMouseDown={() => handleMouseDown(dir as Direction)}
                            onMouseUp={handleMouseUp}
                            tabIndex={-1}
                        >
                            <span
                                className="text-2xl pointer-events-none select-none"
                                style={{
                                    display: "inline-block",
                                    transform: `rotate(0deg)`,
                                    fontFamily: "Arial, sans-serif",
                                }}
                            >
                                {"\u25B2"}
                            </span>
                        </button>
                    ))}

                    {/* 重置按钮 */}
                    <button
                        onClick={handleReset}
                        className="absolute left-1/2 top-1/2 w-10 h-10 rounded-full bg-black flex justify-center items-center text-white hover:bg-blue-500 border-0 transition-colors"
                        style={{ transform: 'translate(-50%, -50%)' }}
                    >
                        <RefreshCcwDot size={20} />
                    </button>
                </div>
            </div>

            {/* 缩放控制 */}
            {cameraType == "zoom" &&
                <Slider
                title="变焦"
                value={zoom}
                onChange={handleZoomChange}
                min={currentCamera?.min_zoom_factor}
                max={currentCamera?.max_zoom_factor}
                step={0.5}
            /> 
            }
        </div>
    );
}
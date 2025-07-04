"use client"
import { cn } from "@/lib/utils";
import { Slider } from "./slider";
import { RefreshCcwDot } from "lucide-react";
import { useRef, useEffect, useState } from "react";

type Direction = "up" | "down" | "left" | "right" | "left-up" | "left-down" | "right-up" | "right-down";

export function DirectionsScaleControl({ 
    className, 
    onDirection = (_direction: Direction) => {console.log(_direction)}, 
    onScale = (_scale: number) => {console.log(_scale)}, 
    onReset = () => {console.log("reset")} 
}: { 
    className?: string, 
    onDirection?: (direction: Direction) => void, 
    onScale?: (scale: number) => void, 
    onReset?: () => void 
}) {
    const [scale, setScale] = useState(1);
    const [activeDir, setActiveDir] = useState<Direction | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const pressedKeysRef = useRef<Set<string>>(new Set());

    // 键盘方向与方向名映射
    const keyToDir: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
    };

    // 组合键映射
    function getComboDirection(keys: Set<string>): Direction | null {
        // 只允许最多一个上下和一个左右方向
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        function triggerDirection() {
            const dir = getComboDirection(pressedKeysRef.current);
            setActiveDir(dir);
            if (dir) onDirection(dir);
        }

        function handleKeyDown(e: KeyboardEvent) {
            // 处理方向键
            if (keyToDir[e.key]) {
                e.preventDefault(); // 阻止默认行为，避免滚动等
                pressedKeysRef.current.add(e.key);
                triggerDirection();
                return;
            }
            
            // 处理缩放键
            if (e.key === "+" || e.key === "=") {
                e.preventDefault();
                setScale(s => { 
                    const next = Math.min(100, Math.round((s + 0.4) * 10) / 10); 
                    onScale(next); 
                    return next; 
                });
            }
            if (e.key === "-" || e.key === "_") {
                e.preventDefault();
                setScale(s => { 
                    const next = Math.max(0, Math.round((s - 0.4) * 10) / 10); 
                    onScale(next); 
                    return next; 
                });
            }
        }

        function handleKeyUp(e: KeyboardEvent) {
            if (keyToDir[e.key]) {
                e.preventDefault();
                pressedKeysRef.current.delete(e.key);
                triggerDirection();
            }
        }

        // 处理窗口失焦时清空按键状态
        function handleBlur() {
            pressedKeysRef.current.clear();
            setActiveDir(null);
        }

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", handleBlur);
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("blur", handleBlur);
        };
    }, [onDirection, onScale]);

    // 鼠标点击方向按钮
    function handleDirection(dir: Direction) {
        setActiveDir(dir);
        onDirection(dir);
        setTimeout(() => setActiveDir(null), 200); // 200ms后恢复
    }

    // 鼠标操作倍率
    function handleScaleChange(v: number) {
        setScale(v);
        onScale(v);
    }

    return (
        <div ref={containerRef} className={cn("w-auto h-40 flex flex-row items-center justify-between", className)}>
            <div className="relative h-full bg-white shadow-lg aspect-square rounded-full flex items-center justify-center">
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
                                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center transition-colors active:text-blue-500",
                                activeDir === dir ? " text-blue-500" : "bg-white text-black",
                            )}
                            style={{
                                transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-60px)`,
                            }}
                            onClick={() => handleDirection(dir as Direction)}
                            tabIndex={-1}
                        >
                            <span
                                className="text-2xl pointer-events-none select-none"
                                style={{
                                    display: "inline-block",
                                    transform: `rotate(0deg)`,
                                    fontFamily: "Segoe MDL2 Assets",
                                }}
                            >
                                {"\u25B2"}
                            </span>
                        </button>
                    ))}
                    <button 
                        onClick={() => onReset()} 
                        className="absolute left-1/2 top-1/2 w-10 h-10 rounded-full bg-black flex justify-center items-center text-white active:bg-blue-500 border-0" 
                        style={{transform: 'translate(-50%, -50%)'}}
                    >
                        <RefreshCcwDot/>
                    </button>
                </div>
            </div>
            <Slider title="倍率" value={scale} onChange={handleScaleChange} />
        </div>
    );
}
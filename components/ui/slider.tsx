import { cn } from "@/lib/utils";

interface SliderProps {
    title: string;
    value: number;
    onChange: (value: number) => void;
    className?: string;
    min?: number;
    max?: number;
    step?: number;
}

export function Slider({ 
    title, 
    value, 
    onChange, 
    className, 
    min = 2, 
    max = 200, 
    step = 0.1 
}: SliderProps) {
    // 受控组件：始终以父组件的 value 为准
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        onChange(newValue);
    };

    // 计算进度百分比用于渐变背景（从下到上）
    const progress = ((value - min) / (max - min)) * 100;

    return (
        <div className={cn("flex flex-col items-center space-y-3 h-32", className)}>
            <label className="text-sm font-medium text-gray-700">{title}</label>
            <div className="flex flex-col items-center space-y-2 flex-1">
                <span className="text-sm font-medium text-gray-600">
                    {value?.toFixed(1)}
                </span>
                <div className="relative flex-1 flex items-center pb-4 mx-4">
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        onChange={handleChange}
                        className="mb-3 mx-2 h-24 w-2 rounded appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        style={{
                            background: `linear-gradient(to top, #3b82f6 0%, #3b82f6 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`,
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            writingMode: 'vertical-rl',
                            WebkitWritingMode: 'vertical-rl',
                            direction: 'rtl'
                        }}
                    />
                </div>
            </div>
            <style jsx>{`
                input[type="range"] {
                    -webkit-appearance: slider-vertical;
                    writing-mode: vertical-rl;
                    direction: rtl;
                }
                
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 24px;
                    height: 16px;
                    background: #ffffff;
                    border: 2px solid #3b82f6;
                    border-radius: 3px;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    transition: all 0.2s ease;
                }
                
                input[type="range"]::-webkit-slider-thumb:hover {
                    background: #f8fafc;
                    border-color: #2563eb;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                    transform: scale(1.1);
                }
                
                input[type="range"]::-webkit-slider-thumb:active {
                    background: #e2e8f0;
                    border-color: #1d4ed8;
                    transform: scale(0.95);
                }
                
                input[type="range"]::-moz-range-thumb {
                    width: 24px;
                    height: 16px;
                    background: #ffffff;
                    border: 2px solid #3b82f6;
                    border-radius: 3px;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    transition: all 0.2s ease;
                    -moz-appearance: none;
                }
                
                input[type="range"]::-moz-range-track {
                    background: transparent;
                    width: 8px;
                    border-radius: 4px;
                }
                
                /* Firefox 竖直滑块特殊处理 */
                @-moz-document url-prefix() {
                    input[type="range"] {
                        writing-mode: vertical-lr;
                        direction: ltr;
                        transform: rotate(180deg);
                    }
                }
            `}</style>
        </div>
    );
}
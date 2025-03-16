"use client";

import { JobDetailResult, JobEditionResult } from "@/api/job/types";
import { Button } from "@/components/ui/button";
import { FormControl, FormItem } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash } from "lucide-react";
import { useState } from "react";

interface DroneSelectProps {
  selectedDrones: JobDetailResult["drones"];
  setSelectedDrones: React.Dispatch<
    React.SetStateAction<JobDetailResult["drones"]>
  >;
  isEditMode: boolean; // Whether we're in edit or create mode
  availableDrones: JobEditionResult["drones"]; // Drones available for selection
}

export default function DroneSelectionPanel({
  selectedDrones,
  setSelectedDrones,
  isEditMode,
  availableDrones,
}: DroneSelectProps) {
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedDroneKey, setSelectedDroneKey] = useState<string | undefined>(
    undefined
  );

  // Toggle collapsed state
  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.preventDefault();
    setCollapsed(!collapsed);
  };

  // Clear all selected drones
  const handleClearDrones = () => {
    setSelectedDrones([]);
  };

  // Add a drone to the selection
  const handleAddDrone = () => {
    if (!selectedDroneKey) {
      toast({
        title: "请选择无人机",
        description: "请重新选择无人机",
      });
      return;
    }

    const droneId = parseInt(selectedDroneKey.split("-")[0]);
    const variantionIndex = parseInt(selectedDroneKey.split("-")[1]);

    const drone = availableDrones?.find((d) => d.id === droneId);
    if (!drone) {
      toast({
        title: "无人机不存在",
        description: "请重新选择无人机",
      });
      return;
    }

    const variantion = drone.variantions.find(
      (v) => v.index === variantionIndex
    );
    if (!variantion) {
      toast({
        title: "无人机变体不存在",
        description: "请重新选择无人机",
      });
      return;
    }

    // Generate a random color from the predefined list
    const colors = [
      "#FF5733",
      "#33FF57",
      "#3357FF",
      "#F033FF",
      "#33FFF6",
      "#FF33A6",
      "#FFD700",
      "#4169E1",
      "#32CD32",
      "#8A2BE2",
      "#FF6347",
      "#20B2AA",
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    setSelectedDrones((prev) => {
      return [
        ...prev,
        {
          ...drone,
          variantion: variantion,
          color: color,
        },
      ];
    });
    console.log("drone", drone);

    console.log("selectedDrones", selectedDrones);
  };

  // Remove a drone from the selection
  const handleRemoveDrone = (droneId: number) => {
    setSelectedDrones((prev) => prev.filter((dr) => dr.id !== droneId));
  };

  return (
    <div className="space-y-2 p-3 border rounded-md shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-md font-medium">执飞机型</div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleToggleCollapse}
        >
          {collapsed ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          )}
        </Button>
      </div>

      {!collapsed && (
        <>
          {/* Only show the selection toolbar in edit mode */}
          {isEditMode && (
            <div className="flex justify-between items-center">
              <FormItem className="flex-1 mr-4">
                <Select
                  onValueChange={(value) => {
                    setSelectedDroneKey(value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择无人机">
                        {selectedDroneKey
                          ? availableDrones
                              ?.find(
                                (d) =>
                                  d.id ===
                                  parseInt(selectedDroneKey.split("-")[0])
                              )
                              ?.variantions.find(
                                (v) =>
                                  v.index ===
                                  parseInt(selectedDroneKey.split("-")[1])
                              )?.name
                          : "请选择无人机"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableDrones?.map((e) => (
                      <SelectGroup key={e.id} className="w-full">
                        <SelectLabel className="w-full">{e.model}</SelectLabel>
                        {e.variantions.map((v) => (
                          <SelectItem
                            key={e.id + "-" + v.index}
                            value={`${e.id}-${v.index}` || ""}
                          >
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>

              <Button
                variant="destructive"
                size="icon"
                className="mr-2 h-8 w-8"
                onClick={handleClearDrones}
              >
                <Trash className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                disabled={!selectedDroneKey}
                size="icon"
                type="button"
                className="h-8 w-8 bg-blue-400 text-gray-100 hover:bg-blue-500"
                onClick={handleAddDrone}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Display selected drones */}
          {selectedDrones?.map((d) => (
            <div className="mt-4 px-1" key={d.id}>
              <div className="flex justify-between items-start">
                <div className="text-sm">
                  <p>{d.name}</p>
                  <p className="mt-2 text-gray-500">{d.variantion.name}</p>
                </div>
                <div className="flex-1" />
                <div
                  className="rounded-full h-4 w-4 m-2"
                  style={{ backgroundColor: d.color }}
                />

                {isEditMode && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemoveDrone(d.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="text-xs text-gray-500 flex items-center">
                <div className="mr-2">{d.variantion.gimbal?.name}</div>

                <div
                  className={`rounded-full h-3 w-3 mr-1 ${
                    d.variantion.rtk_available ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <div className="mr-2">
                  {d.variantion.rtk_available ? "RTK可用" : "RTK不可用"}
                </div>

                <div
                  className={`rounded-full h-3 w-3 mr-1 ${
                    d.variantion.thermal_available
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                />
                <div>
                  {d.variantion.thermal_available
                    ? "热成像可用"
                    : "热成像不可用"}
                </div>
              </div>
              {selectedDrones?.length > 1 && <Separator className="my-2" />}
            </div>
          ))}
          {selectedDrones?.length === 0 && (
            <div className="text-sm text-gray-500">请选择无人机机型</div>
          )}
        </>
      )}
    </div>
  );
}

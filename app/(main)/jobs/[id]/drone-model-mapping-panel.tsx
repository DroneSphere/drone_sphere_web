"use client";

import { JobDetailResult } from "@/app/(main)/jobs/[id]/type";
import { Button } from "@/components/ui/button";
import { FormItem } from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface DroneModelMappingProps {
  selectedDrones: JobDetailResult["drones"];
  isEditMode: boolean;
  droneMappings: DroneMapping[];
  setDroneMappings: React.Dispatch<React.SetStateAction<DroneMapping[]>>;
}

// Mock data for available physical drones with SNs
export interface PhysicalDrone {
  id: number;
  sn: string;
  name: string;
  model: string;
  status: "available" | "unavailable" | "maintenance";
}

export interface DroneMapping {
  droneModelId: number;
  physicalDroneId: number;
  droneModelName: string;
  physicalDroneSN: string;
  droneColor: string;
}

// Mock function to get available drones
const mockGetAvailableDrones = (): PhysicalDrone[] => {
  return [
    { id: 1, sn: "DJI0001", name: "Drone #1", model: "Mavic 3", status: "available" },
    { id: 2, sn: "DJI0002", name: "Drone #2", model: "Mavic 3", status: "available" },
    { id: 3, sn: "DJI0003", name: "Drone #3", model: "Phantom 4", status: "maintenance" },
    { id: 4, sn: "DJI0004", name: "Drone #4", model: "Mavic Air 2", status: "available" },
    { id: 5, sn: "DJI0005", name: "Drone #5", model: "Mavic 3", status: "available" },
    { id: 6, sn: "DJI0006", name: "Drone #6", model: "Matrice 300", status: "available" },
    { id: 7, sn: "DJI0007", name: "Drone #7", model: "Matrice 300", status: "unavailable" },
  ];
};

export default function DroneModelMappingPanel({
  selectedDrones,
  isEditMode,
  droneMappings,
  setDroneMappings,
}: DroneModelMappingProps) {
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [availablePhysicalDrones, setAvailablePhysicalDrones] = useState<PhysicalDrone[]>([]);
  
  // Fetch available drones on component mount
  useEffect(() => {
    // In a real application, this would be an API call
    const drones = mockGetAvailableDrones();
    setAvailablePhysicalDrones(drones);
  }, []);

  // Toggle collapsed state
  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.preventDefault();
    setCollapsed(!collapsed);
  };

  // Handle drone selection change
  const handleDroneSelection = (droneModelId: number, physicalDroneId: number) => {
    const droneModel = selectedDrones.find(d => d.id === droneModelId);
    const physicalDrone = availablePhysicalDrones.find(d => d.id === physicalDroneId);
    
    if (!droneModel || !physicalDrone) {
      toast({
        title: "选择错误",
        description: "无法找到所选无人机",
        variant: "destructive",
      });
      return;
    }

    // Check if this drone model already has a mapping
    const existingIndex = droneMappings.findIndex(m => m.droneModelId === droneModelId);
    
    if (existingIndex >= 0) {
      // Update existing mapping
      setDroneMappings(prev => 
        prev.map((mapping, idx) => 
          idx === existingIndex 
            ? {
                droneModelId,
                physicalDroneId,
                droneModelName: droneModel.name,
                physicalDroneSN: physicalDrone.sn,
                droneColor: droneModel.color
              } 
            : mapping
        )
      );
    } else {
      // Add new mapping
      setDroneMappings(prev => [
        ...prev,
        {
          droneModelId,
          physicalDroneId,
          droneModelName: droneModel.name,
          physicalDroneSN: physicalDrone.sn,
          droneColor: droneModel.color
        }
      ]);
    }

    toast({
      title: "映射已更新",
      description: `已将${droneModel.name}映射到${physicalDrone.sn}`,
    });
  };

  // Filter available drones based on their status
  const getAvailableDroneOptions = () => {
    return availablePhysicalDrones.filter(drone => drone.status === "available");
  };

  return (
    <div className="space-y-2 p-3 border rounded-md shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-md font-medium">执飞机型映射</div>
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
          {selectedDrones.length === 0 ? (
            <div className="text-sm text-gray-500">请先选择要执飞的无人机机型</div>
          ) : (
            <div className="space-y-3">
              {selectedDrones.map((drone, index) => {
                const mapping = droneMappings.find(m => m.droneModelId === drone.id);
                return (
                  <div key={drone.id} className="py-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: drone.color }}
                        ></div>
                        <span className="text-sm font-medium">{drone.name}</span>
                      </div>
                      {mapping && (
                        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          已绑定: {mapping.physicalDroneSN}
                        </div>
                      )}
                    </div>
                    
                    {isEditMode && (
                      <FormItem>
                        <Select
                          value={mapping ? String(mapping.physicalDroneId) : ""}
                          onValueChange={(value) => handleDroneSelection(drone.id, parseInt(value))}
                        >
                          <SelectTrigger className="w-full h-8">
                            <SelectValue placeholder="选择物理无人机" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {getAvailableDroneOptions().map((physicalDrone) => (
                                <SelectItem 
                                  key={physicalDrone.id} 
                                  value={String(physicalDrone.id)}
                                  disabled={droneMappings.some(m => 
                                    m.physicalDroneId === physicalDrone.id && 
                                    m.droneModelId !== drone.id
                                  )}
                                >
                                  {physicalDrone.sn} - {physicalDrone.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                    
                    {!isEditMode && mapping && (
                      <div className="text-sm text-gray-600">
                        绑定到物理机: {mapping.physicalDroneSN}
                      </div>
                    )}
                    
                    {!isEditMode && !mapping && (
                      <div className="text-sm text-gray-500 italic">
                        未绑定物理无人机
                      </div>
                    )}
                    
                    {index < selectedDrones.length - 1 && <Separator className="my-2" />}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
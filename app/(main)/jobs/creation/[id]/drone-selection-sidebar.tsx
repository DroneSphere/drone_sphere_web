import { JobEditionResult } from "@/api/job/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface DroneSelectionSidebarProps {
  drones: JobEditionResult["drones"];
  onSelectedChange?: (selected: JobEditionResult["drones"]) => void;
}

const DroneSelectionSidebar = ({
  drones,
  onSelectedChange,
}: DroneSelectionSidebarProps) => {
  const [selectedDrones, setSelectedDrones] = useState<
    JobEditionResult["drones"]
  >([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleAddDrone = (drone: JobEditionResult["drones"][0]) => {
    if (!selectedDrones.some((d) => d.id === drone.id)) {
      const updated = [...selectedDrones, drone];
      setSelectedDrones(updated);
      onSelectedChange?.(updated);
    }
    setIsPopoverOpen(false);
  };

  const handleRemoveDrone = (id: number): void => {
    const updated = selectedDrones.filter((drone) => drone.id !== id);
    setSelectedDrones(updated);
    onSelectedChange?.(updated);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">选择无人机</h3>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus size={16} />
              <span>添加</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="end">
            <ScrollArea className="h-auto max-h-64">
              <div className="p-2">
                {drones
                  .filter(
                    (drone) => !selectedDrones.some((d) => d.id === drone.id)
                  )
                  .map((drone) => (
                    <Button
                      key={drone.id}
                      variant="ghost"
                      className="w-full justify-start text-left p-2 mb-1 h-auto"
                      onClick={() => handleAddDrone(drone)}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {drone.callsign}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {drone.description}
                        </span>
                      </div>
                    </Button>
                  ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-grow overflow-auto">
        {selectedDrones.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-4 text-center">
            未选择无人机，请点击添加按钮选择
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDrones.map((drone) => (
              <Card key={drone.id} className="shadow-sm">
                <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {drone.callsign}
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => handleRemoveDrone(drone.id)}
                  >
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent className="p-3 pt-1">
                  <p className="text-xs text-muted-foreground">{drone.model}</p>
                  <p className="text-xs text-muted-foreground">
                    {drone.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {/* <Badge
                      variant={drone.rtk_available ? "default" : "secondary"}
                      className={`text-xs ${
                        drone.rtk_available
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : ""
                      }`}
                    >
                      {drone.rtk_available ? "支持RTK" : "无RTK"}
                    </Badge>
                    <Badge
                      variant={
                        drone.thermal_available ? "default" : "secondary"
                      }
                      className={`text-xs ${
                        drone.thermal_available
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : ""
                      }`}
                    >
                      {drone.thermal_available ? "支持热成像" : "无热成像"}
                    </Badge> */}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DroneSelectionSidebar;

import { useUserContext } from "@/contexts/user-context";
import {
    DropdownMenu,
    DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { ChevronsUpDown, Command } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "./ui/dropdown-menu";

export function WorkspaceSwitcher() {
  const { workspace, switchWorkspace, isLoading } = useUserContext();
  const [workspaces, setWorkspaces] = useState<
    Array<{ id: string; name: string; type: string }>
  >([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setIsLoadingWorkspaces(true);
        const response = await fetch("/api/workspaces");
        if (response.ok) {
          const data = await response.json();
          setWorkspaces(data);
        }
      } catch (error) {
        console.error("Failed to fetch workspaces:", error);
      } finally {
        setIsLoadingWorkspaces(false);
      }
    };

    fetchWorkspaces();
  }, []);

  if (isLoading || isLoadingWorkspaces) {
    return <div className="p-2">加载中...</div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <Command className="mr-2 size-4" />
          <span>{workspace?.name || "选择工作区"}</span>
          <ChevronsUpDown className="ml-auto size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>工作区</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onSelect={() => switchWorkspace(ws.id)}
            className={
              workspace?.name === ws.name
                ? "bg-accent text-accent-foreground"
                : ""
            }
          >
            <span>{ws.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {ws.type}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

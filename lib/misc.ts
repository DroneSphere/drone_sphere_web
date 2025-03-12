import { usePathname } from "next/navigation";

export function useIsCreateMode(): { isCreateMode: boolean; idPart: string } {
  const pathname = usePathname();
  const idPart = pathname.split("/").pop() || "";

  // Check if the last part of the pathname is "new" or not a valid number
  const isCreateMode = idPart === "new" || isNaN(Number(idPart));

  return { isCreateMode, idPart };
}

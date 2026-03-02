import { useSelf, useOthers } from "@liveblocks/react";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ActiveUsers() {
  const currentUser = useSelf();
  const others = useOthers();

  return (
    <div className="flex items-center gap-1">
      <Users className="h-4 w-4 text-muted-foreground mr-1" />
      {currentUser?.info && (
        <Tooltip>
          <TooltipTrigger>
            <Avatar className="h-6 w-6 border-2" style={{ borderColor: currentUser.info.color as string }}>
              <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                {(currentUser.info.name as string)?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>{currentUser.info.name as string} (you)</TooltipContent>
        </Tooltip>
      )}
      {others.map((other) => (
        <Tooltip key={other.connectionId}>
          <TooltipTrigger>
            <Avatar className="h-6 w-6 border-2" style={{ borderColor: other.info?.color as string }}>
              <AvatarFallback className="text-[10px]" style={{ backgroundColor: other.info?.color as string, color: "white" }}>
                {(other.info?.name as string)?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>{other.info?.name as string}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

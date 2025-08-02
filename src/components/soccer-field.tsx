'use client';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


interface PlayerPosition {
  x: number; // percentage from left
  y: number; // percentage from bottom
  role: string;
}

interface SoccerFieldProps {
  positions: PlayerPosition[];
  formationId: string;
}

export function SoccerField({ positions, formationId }: SoccerFieldProps) {
  return (
    <div className="aspect-[7/10] w-full max-w-sm mx-auto bg-green-600/80 border-2 border-gray-400/50 relative overflow-hidden rounded-lg shadow-inner">
      {/* Field Markings */}
      {/* Center Circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[25%] aspect-square border-2 border-gray-400/50 rounded-full" />
      {/* Center Line */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-gray-400/50" />
      {/* Center Spot */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-400/50 rounded-full" />

      {/* Home Penalty Area */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[18%] border-x-2 border-t-2 border-gray-400/50" />
      {/* Home Goal Area */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[30%] h-[8%] border-x-2 border-t-2 border-gray-400/50" />
       {/* Home Penalty Spot */}
      <div className="absolute bottom-[13%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-400/50 rounded-full" />

      {/* Away Penalty Area */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[18%] border-x-2 border-b-2 border-gray-400/50" />
      {/* Away Goal Area */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30%] h-[8%] border-x-2 border-b-2 border-gray-400/50" />
       {/* Away Penalty Spot */}
      <div className="absolute top-[13%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-400/50 rounded-full" />
      
      {/* Players */}
      <TooltipProvider>
        {positions.map((pos, index) => (
           <Tooltip key={`${formationId}-${index}`}>
            <TooltipTrigger asChild>
                <div
                    className="absolute w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${pos.x}%`, bottom: `${pos.y}%` }}
                >
                    {pos.role}
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{pos.role}</p>
            </TooltipContent>
           </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}

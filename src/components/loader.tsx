import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FullScreenLoader() {
  return (
    <div className="flex items-center justify-center h-screen w-screen fixed inset-0 bg-background z-50">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin', className)} />;
}
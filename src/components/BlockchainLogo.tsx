import { cn } from '@/lib/utils';

interface BlockchainLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BlockchainLogo = ({ className, size = 'md' }: BlockchainLogoProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Outer hexagon */}
        <polygon
          points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
          className="fill-none stroke-primary"
          strokeWidth="2"
        />
        {/* Inner hexagon */}
        <polygon
          points="50,20 75,35 75,65 50,80 25,65 25,35"
          className="fill-primary/20 stroke-primary"
          strokeWidth="1.5"
        />
        {/* Center block */}
        <rect
          x="40"
          y="40"
          width="20"
          height="20"
          rx="3"
          className="fill-primary"
        />
        {/* Connection lines */}
        <line x1="50" y1="20" x2="50" y2="40" className="stroke-primary/60" strokeWidth="1" />
        <line x1="50" y1="60" x2="50" y2="80" className="stroke-primary/60" strokeWidth="1" />
        <line x1="25" y1="50" x2="40" y2="50" className="stroke-primary/60" strokeWidth="1" />
        <line x1="60" y1="50" x2="75" y2="50" className="stroke-primary/60" strokeWidth="1" />
      </svg>
      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
    </div>
  );
};

import { cn } from '@/lib/utils';
import { 
  Eye, 
  FileText, 
  Navigation, 
  HelpCircle, 
  AlertTriangle,
  Footprints,
  Search,
  Pill,
  ShoppingCart
} from 'lucide-react';

export type ModeButtonVariant = 
  | 'detect'
  | 'read'
  | 'navigate'
  | 'help'
  | 'emergency'
  | 'safe-walk'
  | 'find-object'
  | 'medicine'
  | 'shopping';

interface ModeButtonProps {
  variant: ModeButtonVariant;
  isActive?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: 'normal' | 'large' | 'full';
  className?: string;
}

const variantConfig: Record<ModeButtonVariant, { 
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
  inactiveClass: string;
}> = {
  detect: {
    icon: Eye,
    activeClass: 'bg-safe text-safe-foreground border-safe',
    inactiveClass: 'bg-primary text-primary-foreground border-primary hover:bg-primary/90',
  },
  read: {
    icon: FileText,
    activeClass: 'bg-accent text-accent-foreground border-accent',
    inactiveClass: 'bg-secondary text-secondary-foreground border-accent hover:bg-secondary/90',
  },
  navigate: {
    icon: Navigation,
    activeClass: 'bg-safe text-safe-foreground border-safe',
    inactiveClass: 'bg-muted text-foreground border-muted-foreground hover:bg-muted/80',
  },
  help: {
    icon: HelpCircle,
    activeClass: 'bg-accent text-accent-foreground border-accent',
    inactiveClass: 'bg-muted text-foreground border-muted-foreground hover:bg-muted/80',
  },
  emergency: {
    icon: AlertTriangle,
    activeClass: 'bg-destructive text-destructive-foreground border-destructive emergency-active',
    inactiveClass: 'bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90',
  },
  'safe-walk': {
    icon: Footprints,
    activeClass: 'bg-safe text-safe-foreground border-safe',
    inactiveClass: 'bg-primary text-primary-foreground border-primary hover:bg-primary/90',
  },
  'find-object': {
    icon: Search,
    activeClass: 'bg-accent text-accent-foreground border-accent',
    inactiveClass: 'bg-muted text-foreground border-muted-foreground hover:bg-muted/80',
  },
  medicine: {
    icon: Pill,
    activeClass: 'bg-safe text-safe-foreground border-safe',
    inactiveClass: 'bg-muted text-foreground border-muted-foreground hover:bg-muted/80',
  },
  shopping: {
    icon: ShoppingCart,
    activeClass: 'bg-accent text-accent-foreground border-accent',
    inactiveClass: 'bg-muted text-foreground border-muted-foreground hover:bg-muted/80',
  },
};

export function ModeButton({
  variant,
  isActive = false,
  isLoading = false,
  disabled = false,
  onClick,
  children,
  size = 'normal',
  className,
}: ModeButtonProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const sizeClasses = {
    normal: 'h-16 min-h-[64px] text-lg',
    large: 'h-20 min-h-[80px] text-xl',
    full: 'h-24 min-h-[96px] text-2xl w-full',
  };

  return (
    <button
      className={cn(
        'flex items-center justify-center gap-3 rounded-2xl border-2 font-bold',
        'transition-all duration-200 active:scale-95',
        'focus:outline-none focus:ring-4 focus:ring-ring focus:ring-offset-2',
        'no-select px-6',
        sizeClasses[size],
        isActive ? config.activeClass : config.inactiveClass,
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-pressed={isActive}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <span className="w-7 h-7 border-3 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Icon className="w-7 h-7 flex-shrink-0" aria-hidden="true" />
      )}
      <span className="truncate">{children}</span>
    </button>
  );
}

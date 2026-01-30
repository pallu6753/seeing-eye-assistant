import { cn } from '@/lib/utils';

interface ActionButtonProps {
  variant: 'detect' | 'read' | 'emergency';
  isActive?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function ActionButton({
  variant,
  isActive = false,
  isLoading = false,
  disabled = false,
  onClick,
  children,
}: ActionButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'detect':
        return isActive 
          ? 'bg-safe text-safe-foreground' 
          : 'bg-primary text-primary-foreground';
      case 'read':
        return isActive
          ? 'bg-accent text-accent-foreground'
          : 'bg-secondary text-secondary-foreground border-2 border-accent';
      case 'emergency':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'detect':
        return isActive ? '👁️' : '👁️‍🗨️';
      case 'read':
        return isLoading ? '⏳' : '📖';
      case 'emergency':
        return '🆘';
      default:
        return '•';
    }
  };

  return (
    <button
      className={cn(
        'btn-action no-select',
        getVariantStyles(),
        isActive && variant === 'emergency' && 'emergency-active',
        disabled && 'opacity-50 cursor-not-allowed',
        'transition-transform active:scale-95'
      )}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-pressed={isActive}
      aria-busy={isLoading}
    >
      <span className="text-4xl" aria-hidden="true">
        {getIcon()}
      </span>
      <span>{children}</span>
      {isLoading && (
        <span className="absolute right-6">
          <span className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
        </span>
      )}
    </button>
  );
}

import { useState, useCallback } from 'react';
import { Search, X, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FindObjectPanelProps {
  isActive: boolean;
  targetObject: string | null;
  isSearching: boolean;
  foundObjects: string[];
  onSetTarget: (target: string) => void;
  onClearTarget: () => void;
  onVoiceInput: () => void;
}

const commonObjects = [
  'keys', 'phone', 'wallet', 'glasses', 'remote', 'bottle', 'cup', 'bag'
];

export function FindObjectPanel({
  isActive,
  targetObject,
  isSearching,
  foundObjects,
  onSetTarget,
  onClearTarget,
  onVoiceInput,
}: FindObjectPanelProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSetTarget(inputValue.trim().toLowerCase());
      setInputValue('');
    }
  }, [inputValue, onSetTarget]);

  if (!isActive) return null;

  return (
    <div className="bg-card rounded-2xl border-2 border-border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-lg text-foreground">Find Object</h2>
      </div>

      {/* Current target */}
      {targetObject ? (
        <div className="bg-accent/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Looking for:</p>
              <p className="text-xl font-bold text-foreground capitalize">{targetObject}</p>
            </div>
            <button
              onClick={onClearTarget}
              className="p-2 rounded-full bg-muted hover:bg-muted/80"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {isSearching && (
            <div className="mt-3 flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Scanning...</span>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="What are you looking for?"
              className={cn(
                'flex-1 px-4 py-3 rounded-xl text-lg',
                'bg-muted text-foreground placeholder:text-muted-foreground',
                'border-2 border-transparent focus:border-primary focus:outline-none'
              )}
              aria-label="Object to find"
            />
            <button
              type="button"
              onClick={onVoiceInput}
              className="p-3 rounded-xl bg-primary text-primary-foreground"
              aria-label="Use voice input"
            >
              <Mic className="w-6 h-6" />
            </button>
          </form>

          {/* Quick options */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Common items:</p>
            <div className="flex flex-wrap gap-2">
              {commonObjects.map((obj) => (
                <button
                  key={obj}
                  onClick={() => onSetTarget(obj)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium capitalize',
                    'bg-muted text-foreground hover:bg-muted/80',
                    'transition-colors'
                  )}
                >
                  {obj}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Found objects in view */}
      {foundObjects.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">Objects in view:</p>
          <div className="flex flex-wrap gap-2">
            {foundObjects.map((obj, i) => (
              <span
                key={`${obj}-${i}`}
                className={cn(
                  'px-3 py-1 rounded-full text-sm',
                  obj === targetObject 
                    ? 'bg-safe text-safe-foreground font-bold'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {obj}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

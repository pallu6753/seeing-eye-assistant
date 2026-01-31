import { useState } from 'react';
import { Settings, Volume2, Vibrate, Gauge, Globe, Moon, Sun, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsValue {
  voiceSpeed: number;
  voiceVolume: number;
  vibrationStrength: 'off' | 'low' | 'medium' | 'high';
  language: string;
  darkMode: boolean;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsValue;
  onSettingsChange: (settings: SettingsValue) => void;
}

const languages = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'hi-IN', name: 'Hindi (हिंदी)' },
  { code: 'kn-IN', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ta-IN', name: 'Tamil (தமிழ்)' },
  { code: 'es-ES', name: 'Spanish (Español)' },
];

export function SettingsPanel({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const updateSetting = <K extends keyof SettingsValue>(key: K, value: SettingsValue[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted"
          aria-label="Close settings"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* Settings list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Voice Speed */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3 mb-3">
            <Gauge className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Voice Speed</span>
            <span className="ml-auto text-muted-foreground">{settings.voiceSpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={settings.voiceSpeed}
            onChange={(e) => updateSetting('voiceSpeed', parseFloat(e.target.value))}
            className="w-full h-3 rounded-full appearance-none bg-muted cursor-pointer"
            aria-label="Voice speed"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>

        {/* Voice Volume */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3 mb-3">
            <Volume2 className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Voice Volume</span>
            <span className="ml-auto text-muted-foreground">{Math.round(settings.voiceVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.voiceVolume}
            onChange={(e) => updateSetting('voiceVolume', parseFloat(e.target.value))}
            className="w-full h-3 rounded-full appearance-none bg-muted cursor-pointer"
            aria-label="Voice volume"
          />
        </div>

        {/* Vibration Strength */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3 mb-3">
            <Vibrate className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Vibration</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(['off', 'low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                onClick={() => updateSetting('vibrationStrength', level)}
                className={cn(
                  'py-2 rounded-lg text-sm font-medium capitalize transition-colors',
                  settings.vibrationStrength === level
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setActiveSection(activeSection === 'language' ? null : 'language')}
            className="w-full flex items-center gap-3 p-4"
          >
            <Globe className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Language</span>
            <span className="ml-auto text-muted-foreground">
              {languages.find(l => l.code === settings.language)?.name || 'English'}
            </span>
            <ChevronRight className={cn(
              'w-5 h-5 text-muted-foreground transition-transform',
              activeSection === 'language' && 'rotate-90'
            )} />
          </button>
          
          {activeSection === 'language' && (
            <div className="border-t border-border">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    updateSetting('language', lang.code);
                    setActiveSection(null);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 text-left',
                    'hover:bg-muted transition-colors',
                    settings.language === lang.code && 'bg-primary/10'
                  )}
                >
                  <span>{lang.name}</span>
                  {settings.language === lang.code && (
                    <span className="text-primary font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dark Mode */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            {settings.darkMode ? (
              <Moon className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Sun className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="font-medium">Dark Mode</span>
            <button
              onClick={() => updateSetting('darkMode', !settings.darkMode)}
              className={cn(
                'ml-auto w-12 h-7 rounded-full transition-colors relative',
                settings.darkMode ? 'bg-primary' : 'bg-muted'
              )}
              role="switch"
              aria-checked={settings.darkMode}
            >
              <span
                className={cn(
                  'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform',
                  settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useCallback } from 'react';
import { speak } from '@/lib/speech';
import { haptics } from '@/lib/haptics';

type ButtonName = 
  | 'detect'
  | 'read'
  | 'navigate'
  | 'safe-walk'
  | 'emergency'
  | 'help'
  | 'find-object'
  | 'try-location'
  | 'settings'
  | 'install';

const BUTTON_ANNOUNCEMENTS: Record<ButtonName, string> = {
  'detect': 'Object detection.',
  'read': 'Text reader.',
  'navigate': 'Navigation.',
  'safe-walk': 'Safe walk mode.',
  'emergency': 'Emergency.',
  'help': 'Help me.',
  'find-object': 'Find object.',
  'try-location': 'Try demo location.',
  'settings': 'Settings.',
  'install': 'Install app.',
};

export function useSpeakOnTap() {
  const announceButton = useCallback((buttonName: ButtonName, skipHaptic = false) => {
    const announcement = BUTTON_ANNOUNCEMENTS[buttonName];
    if (announcement) {
      speak(announcement, 'normal');
      if (!skipHaptic) {
        haptics.modeChanged();
      }
    }
  }, []);

  const createTapHandler = useCallback((
    buttonName: ButtonName,
    handler: () => void,
    announceFirst = true
  ) => {
    return () => {
      if (announceFirst) {
        announceButton(buttonName);
      }
      handler();
    };
  }, [announceButton]);

  return {
    announceButton,
    createTapHandler,
  };
}

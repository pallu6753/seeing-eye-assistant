import { useState, useRef, useCallback } from 'react';
import Tesseract from 'tesseract.js';

interface UseOCRReturn {
  isProcessing: boolean;
  text: string | null;
  error: string | null;
  recognizeText: (image: HTMLCanvasElement | HTMLVideoElement | ImageData) => Promise<string>;
  clearText: () => void;
}

export function useOCR(): UseOCRReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const workerRef = useRef<Tesseract.Worker | null>(null);

  const recognizeText = useCallback(async (
    image: HTMLCanvasElement | HTMLVideoElement | ImageData
  ): Promise<string> => {
    setIsProcessing(true);
    setError(null);

    try {
      let imageSource: HTMLCanvasElement;

      if (image instanceof HTMLVideoElement) {
        // Convert video to canvas
        const canvas = document.createElement('canvas');
        canvas.width = image.videoWidth;
        canvas.height = image.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(image, 0, 0);
        }
        imageSource = canvas;
      } else if (image instanceof ImageData) {
        // Convert ImageData to canvas
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(image, 0, 0);
        }
        imageSource = canvas;
      } else {
        imageSource = image;
      }

      const result = await Tesseract.recognize(
        imageSource,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          },
        }
      );

      const recognizedText = result.data.text.trim();
      setText(recognizedText);
      setIsProcessing(false);
      
      return recognizedText;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OCR failed';
      setError(message);
      setIsProcessing(false);
      console.error('OCR error:', err);
      throw err;
    }
  }, []);

  const clearText = useCallback(() => {
    setText(null);
    setError(null);
  }, []);

  return {
    isProcessing,
    text,
    error,
    recognizeText,
    clearText,
  };
}

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Result, NotFoundException, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

// ZXing hint constants for better type safety
const Hints = {
  TRY_HARDER: DecodeHintType.TRY_HARDER,
  PURE_BARCODE: DecodeHintType.PURE_BARCODE,
  CHARACTER_SET: DecodeHintType.CHARACTER_SET,
  NEED_RESULT_POINT_CALLBACK: DecodeHintType.NEED_RESULT_POINT_CALLBACK,
  POSSIBLE_FORMATS: DecodeHintType.POSSIBLE_FORMATS,
} as const;

// Supported barcode formats for retail products
const SUPPORTED_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8, 
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93
] as const;

// Duplicate detection cooldown in milliseconds
const DUPLICATE_COOLDOWN_MS = 2000;

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastDetectedCodeRef = useRef<string | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);

  const stopScanner = () => {
    try {
      if (readerRef.current) {
        // BrowserMultiFormatReader doesn't have a reset method, just set to null
        readerRef.current = null;
      }
      
      // Stop all video tracks
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    } catch (e) {
      // Silently handle cleanup errors
      console.warn('Error during scanner cleanup:', e);
    }
    
    setScanning(false);
    setIsInitialized(false);
  };

  useEffect(() => {
    if (!videoRef.current) return;

    const initializeScanner = async () => {
      try {
        // Create new reader instance
        readerRef.current = new BrowserMultiFormatReader();
        
        // Configure the reader for better accuracy
        const hints = new Map();
        hints.set(Hints.TRY_HARDER, true);
        hints.set(Hints.PURE_BARCODE, true);
        hints.set(Hints.CHARACTER_SET, true);
        hints.set(Hints.NEED_RESULT_POINT_CALLBACK, true);
        hints.set(Hints.POSSIBLE_FORMATS, SUPPORTED_FORMATS);
        
        readerRef.current.setHints(hints);
        
        // Start scanning
        await readerRef.current.decodeFromVideoDevice(
          undefined, // Use default camera
          videoRef.current,
          (result: Result | null, error: Error | null) => {
            if (result) {
              const code = result.getText();
              const confidence = result.getResultMetadata()?.get(2) as number || 0;
              const currentTime = Date.now();
              
              // Prevent duplicate detections within cooldown period
              if (lastDetectedCodeRef.current === code && 
                  currentTime - lastDetectionTimeRef.current < DUPLICATE_COOLDOWN_MS) {
                return;
              }
              
              // Accept detection if confidence is available or 0 (default)
              if (confidence >= 0) {
                lastDetectedCodeRef.current = code;
                lastDetectionTimeRef.current = currentTime;
                
                if (scanning) {
                  setScanning(false);
                  onDetected(code);
                  stopScanner();
                }
              }
            }
            
            // Only log actual errors, not expected NotFoundException
            if (error && !(error instanceof NotFoundException)) {
              console.warn('Barcode scanning error:', error);
            }
          }
        );
        
        setIsInitialized(true);
        
      } catch (e) {
        console.error('Failed to initialize barcode scanner:', e);
        setError('Camera access denied or not supported');
      }
    };

    initializeScanner();

    // Cleanup on unmount
    return () => {
      stopScanner();
    };
  }, [onDetected, scanning]); // Include dependencies

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className="relative w-full max-w-xs mx-auto bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 p-2 transition-colors"
          aria-label="Close scanner"
        >
          <X className="h-6 w-6" />
        </button>
        
        <h2 className="mb-2 text-lg font-bold">Scan Barcode</h2>
        
        {error ? (
          <div className="text-red-500 text-center p-4">{error}</div>
        ) : (
          <div className="w-full h-48 bg-black rounded overflow-hidden relative">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
              aria-label="Barcode scanner camera feed"
            />
            {/* Scanning overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-1 bg-white opacity-75 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
        
        <p className="mt-2 text-xs text-gray-500 text-center">
          Point your camera at the barcode
        </p>
        
        {isInitialized && (
          <p className="mt-1 text-xs text-green-600">Scanner ready</p>
        )}
      </div>
    </div>
  );
} 
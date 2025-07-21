import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let active = true;
    let stream: MediaStream | null = null;

    async function startScanner() {
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        const deviceId = videoInputDevices[0]?.deviceId;
        if (!deviceId) {
          setError('No camera found');
          return;
        }
        const result = await codeReader.decodeOnceFromVideoDevice(deviceId, videoRef.current!);
        if (result && active) {
          setScanning(false);
          onDetected(result.getText());
        }
      } catch (e: any) {
        setError('Camera access denied or not supported.');
      }
    }
    if (scanning) startScanner();
    return () => {
      active = false;
      // Stop the camera stream if available
      if (videoRef.current && videoRef.current.srcObject) {
        stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onDetected, scanning]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className="relative w-full max-w-xs mx-auto bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 p-2">
          <X className="h-6 w-6" />
        </button>
        <h2 className="mb-2 text-lg font-bold">Scan Barcode</h2>
        {error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <video ref={videoRef} className="w-full h-48 bg-black rounded" autoPlay muted playsInline />
        )}
        <p className="mt-2 text-xs text-gray-500">Point your camera at the barcode</p>
      </div>
    </div>
  );
} 
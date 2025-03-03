"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Camera, FlipHorizontal, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AnalysisResponse } from "@/lib/openai";

const Webcam = dynamic(() => import("react-webcam"), {
  ssr: false,
});

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export default function CameraCapture({
  onCapture,
  onClose,
}: CameraCaptureProps) {
  const webcamRef = useRef<any>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check camera permissions when component mounts
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        setHasPermission(true);
      })
      .catch((err) => {
        setHasPermission(false);
        handleUserMediaError(err);
      });
  }, []);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  }, [onCapture]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleUserMediaError = (error: any) => {
    let errorMessage = "Could not access camera.";
    
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      errorMessage = "Camera access was denied. Please allow camera access in your browser settings.";
    } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      errorMessage = "No camera found. Please connect a camera and try again.";
    } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      errorMessage = "Camera is in use by another application. Please close other apps using the camera.";
    }

    toast({
      title: "Camera Error",
      description: errorMessage,
      variant: "destructive",
    });
    onClose();
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 p-6 rounded-lg max-w-md text-center">
          <h3 className="text-xl font-semibold text-green-400 mb-4">Camera Access Required</h3>
          <p className="text-gray-300 mb-6">
            To use the camera feature, please:
          </p>
          <ol className="text-left text-gray-300 space-y-2 mb-6">
            <li>1. Click the camera icon in your browser's address bar</li>
            <li>2. Select "Allow" for camera access</li>
            <li>3. Refresh the page</li>
          </ol>
          <Button
            onClick={onClose}
            variant="outline"
            className="border-green-500/30 hover:bg-gray-800/70 hover:border-green-500/50"
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-lg mx-auto">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode,
            aspectRatio: 4 / 3,
          }}
          className="w-full rounded-lg shadow-lg"
          onUserMediaError={handleUserMediaError}
        />

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
          <Button
            onClick={toggleCamera}
            variant="outline"
            size="icon"
            className="bg-gray-800/50 border-green-500/30 hover:bg-gray-800/70 hover:border-green-500/50"
          >
            <FlipHorizontal className="w-6 h-6 text-green-400" />
          </Button>

          <Button
            onClick={capture}
            size="icon"
            className="bg-green-500 hover:bg-green-600"
          >
            <Camera className="w-6 h-6" />
          </Button>

          <Button
            onClick={onClose}
            variant="outline"
            size="icon"
            className="bg-gray-800/50 border-green-500/30 hover:bg-gray-800/70 hover:border-green-500/50"
          >
            <X className="w-6 h-6 text-green-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}

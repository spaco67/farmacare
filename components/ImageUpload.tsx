"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, Sprout, Camera, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalysisResponse } from "@/lib/openai";
import Chat from "./Chat";
import CameraCapture from "./CameraCapture";

export default function ImageUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    await processImage(e.target.files[0]);
  };

  const processImage = async (file: File | Blob) => {
    setIsLoading(true);
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to analyze image");

      const result = await response.json();
      setAnalysis(result);

      toast({
        title: "Analysis Complete / An gama nazarin hoton",
        description:
          "You can now chat about the analysis / Yanzu za ku iya tattaunawa game da nazarin.",
      });
    } catch (error) {
      toast({
        title: "Error / Kuskure",
        description:
          "Failed to analyze image. Please try again. / An kasa nazarin hoton. Da fatan za a sake gwadawa.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowCamera(false);
    }
  };

  const handleCameraCapture = async (imageData: string) => {
    // Convert base64 to blob
    const response = await fetch(imageData);
    const blob = await response.blob();
    await processImage(blob);
  };

  const handleReset = () => {
    setAnalysis(null);
    setShowCamera(false);
  };

  if (analysis) {
    return <Chat initialAnalysis={analysis} onReset={handleReset} />;
  }

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  const AnalysisSection = ({
    title,
    data,
  }: {
    title: string;
    data: { diagnosis: string; confidence: number; recommendations: string[] };
  }) => (
    <div className="space-y-3">
      <h3 className="text-xl font-bold text-green-800 dark:text-green-300">
        {title}
      </h3>
      <div className="space-y-6">
        <div className="space-y-3">
          <h4 className="font-semibold text-green-700 dark:text-green-400">
            {title === "Hausa" ? "Matsalar da aka Gano" : "Identified Issue"}
          </h4>
          <p className="text-lg text-green-700 dark:text-green-200 bg-white/50 dark:bg-black/20 p-4 rounded-lg">
            {data.diagnosis}
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-green-700 dark:text-green-400">
            {title === "Hausa" ? "Tabbacin Matsalar" : "Confidence Level"}
          </h4>
          <div className="bg-white/50 dark:bg-black/20 p-4 rounded-lg space-y-2">
            <div className="w-full bg-green-200 dark:bg-green-900 rounded-full h-4">
              <div
                className="bg-green-600 dark:bg-green-400 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${data.confidence}%` }}
              />
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              {data.confidence}%{" "}
              {title === "Hausa" ? "na tabbaci" : "confidence"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-green-700 dark:text-green-400">
            {title === "Hausa" ? "Shawarwari" : "Recommendations"}
          </h4>
          <div className="bg-white/50 dark:bg-black/20 p-4 rounded-lg">
            <ul className="space-y-3">
              {data.recommendations.map((rec, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-green-700 dark:text-green-200"
                >
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 dark:bg-green-500 text-white rounded-full flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center w-full">
        <div className="w-full max-w-2xl">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button
              onClick={() => document.getElementById("image-upload")?.click()}
              className="bg-gray-800/50 hover:bg-gray-800/70 border-2 border-dashed border-green-500/50 hover:border-green-500 h-32 rounded-xl"
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-green-400" />
                <span className="text-green-400 font-semibold">
                  Upload Image
                </span>
                <span className="text-green-400/70 text-sm">Ɗora Hoto</span>
              </div>
            </Button>

            <Button
              onClick={() => setShowCamera(true)}
              className="bg-gray-800/50 hover:bg-gray-800/70 border-2 border-dashed border-green-500/50 hover:border-green-500 h-32 rounded-xl"
            >
              <div className="flex flex-col items-center gap-2">
                <Camera className="w-8 h-8 text-green-400" />
                <span className="text-green-400 font-semibold">Take Photo</span>
                <span className="text-green-400/70 text-sm">Ɗauki Hoto</span>
              </div>
            </Button>
          </div>

          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
            </div>
          )}
        </div>

        <Input
          id="image-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isLoading}
        />
      </div>

      {analysis && (
        <div className="space-y-8">
          <Tabs defaultValue="hausa" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hausa">Hausa</TabsTrigger>
              <TabsTrigger value="english">English</TabsTrigger>
            </TabsList>
            <TabsContent value="hausa" className="mt-6">
              <AnalysisSection title="Hausa" data={analysis.hausa} />
            </TabsContent>
            <TabsContent value="english" className="mt-6">
              <AnalysisSection title="English" data={analysis.english} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VoiceSearch() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    // Set Nigerian languages
    recognition.lang = 'en-NG'; // English (Nigeria)
    // Add more Nigerian languages as needed
    // 'yo-NG' for Yoruba
    // 'ig-NG' for Igbo
    // 'ha-NG' for Hausa

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      // Here you would typically trigger a search with the transcript
      handleSearch(text);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast({
        title: "Error",
        description: "Failed to recognize speech. Please try again.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return () => {
      recognition.abort();
    };
  }, [toast]);

  const handleSearch = async (query: string) => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search failed");
      
      const results = await response.json();
      // Handle search results here
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleListening = () => {
    if (isListening) {
      (window as any).recognition?.stop();
    } else {
      (window as any).recognition?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={toggleListening}
        className={`w-full ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
      >
        {isListening ? (
          <>
            <MicOff className="w-4 h-4 mr-2" />
            Stop Listening
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 mr-2" />
            Start Voice Search
          </>
        )}
      </Button>
      {transcript && (
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p className="text-sm font-medium">You said:</p>
          <p className="text-lg">{transcript}</p>
        </div>
      )}
    </div>
  );
}
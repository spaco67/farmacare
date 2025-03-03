import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Mic, MicOff } from "lucide-react";
import type { AnalysisResponse } from "@/lib/openai";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  analysis?: AnalysisResponse;
}

interface ChatProps {
  initialAnalysis: AnalysisResponse;
  onReset: () => void;
}

export default function Chat({ initialAnalysis, onReset }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "I've analyzed your plant image. You can ask me any follow-up questions about the analysis.",
      analysis: initialAnalysis,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<"en" | "ha">("en");
  const { toast } = useToast();

  // Speech recognition setup
  const recognition = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      // @ts-ignore
      recognition.current = new webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;

      recognition.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join("");

        setInput(transcript);
      };

      recognition.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        toast({
          title: "Speech Recognition Error",
          description: "Failed to recognize speech. Please try again.",
          variant: "destructive",
        });
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognition.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognition.current.stop();
      setIsListening(false);
    } else {
      setInput("");
      recognition.current.lang = currentLanguage === "en" ? "en-US" : "ha";
      recognition.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (isListening) {
      recognition.current?.stop();
    }

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
          analysis: initialAnalysis,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process your question. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const AnalysisSection = ({
    title,
    data,
  }: {
    title: string;
    data: { diagnosis: string; confidence: number; recommendations: string[] };
  }) => (
    <div className="space-y-3 bg-white/50 dark:bg-black/20 rounded-lg p-4">
      <h3 className="font-bold text-green-800 dark:text-green-300">{title}</h3>
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-green-700 dark:text-green-400">
            {title === "Hausa" ? "Matsalar da aka Gano" : "Identified Issue"}
          </h4>
          <p className="text-green-700 dark:text-green-200">{data.diagnosis}</p>
        </div>

        <div>
          <h4 className="font-semibold text-green-700 dark:text-green-400">
            {title === "Hausa" ? "Tabbacin Matsalar" : "Confidence Level"}
          </h4>
          <div className="space-y-1">
            <div className="w-full bg-green-200 dark:bg-green-900 rounded-full h-2">
              <div
                className="bg-green-600 dark:bg-green-400 h-2 rounded-full"
                style={{ width: `${data.confidence}%` }}
              />
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              {data.confidence}%{" "}
              {title === "Hausa" ? "na tabbaci" : "confidence"}
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-green-700 dark:text-green-400">
            {title === "Hausa" ? "Shawarwari" : "Recommendations"}
          </h4>
          <ul className="space-y-2">
            {data.recommendations.map((rec, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-green-700 dark:text-green-200"
              >
                <span className="flex-shrink-0 w-5 h-5 bg-green-600 dark:bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                  {index + 1}
                </span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[80vh] max-h-[800px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === "user"
                  ? "bg-green-600 text-white"
                  : "bg-gray-800/50"
              }`}
            >
              {message.analysis ? (
                <Tabs defaultValue="hausa" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="hausa">Hausa</TabsTrigger>
                    <TabsTrigger value="english">English</TabsTrigger>
                  </TabsList>
                  <TabsContent value="hausa" className="mt-4">
                    <AnalysisSection
                      title="Hausa"
                      data={message.analysis.hausa}
                    />
                  </TabsContent>
                  <TabsContent value="english" className="mt-4">
                    <AnalysisSection
                      title="English"
                      data={message.analysis.english}
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <p>{message.content}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <Loader2 className="w-5 h-5 animate-spin text-green-400" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-800 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                currentLanguage === "en"
                  ? "Ask a follow-up question..."
                  : "Yi tambaya..."
              }
              disabled={isLoading}
              className="pr-12 bg-gray-800/50 border-green-500/30 focus:border-green-500/50"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={toggleSpeechRecognition}
            >
              {isListening ? (
                <MicOff className="w-5 h-5 text-red-400" />
              ) : (
                <Mic className="w-5 h-5 text-green-400" />
              )}
            </Button>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (isListening) {
                recognition.current?.stop();
              }
              onReset();
            }}
            className="bg-gray-800/50 border-green-500/30 hover:bg-gray-800/70 hover:border-green-500/50"
          >
            Upload New Image
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setCurrentLanguage((prev) => (prev === "en" ? "ha" : "en"))
            }
            className="bg-gray-800/50 border-green-500/30 hover:bg-gray-800/70 hover:border-green-500/50"
          >
            {currentLanguage === "en" ? "EN" : "HA"}
          </Button>
        </form>
      </div>
    </div>
  );
}

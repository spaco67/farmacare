import { NextResponse } from "next/server";
import { analyzeImage } from "@/lib/openai";

// In-memory storage for analysis results
let analysisHistory: any[] = [];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.toLowerCase();

    if (!query) {
      return NextResponse.json(
        { error: 'No search query provided' },
        { status: 400 }
      );
    }

    const results = analysisHistory.filter(analysis => 
      analysis.diagnosis.toLowerCase().includes(query) ||
      analysis.recommendations.some((rec: string) => 
        rec.toLowerCase().includes(query)
      )
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search analyses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { image } = await request.json();
    
    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const analysis = await analyzeImage(image);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
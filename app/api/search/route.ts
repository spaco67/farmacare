import { NextResponse } from 'next/response';

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

export async function POST(req: Request) {
  try {
    const analysis = await req.json();
    analysisHistory.push({
      ...analysis,
      createdAt: new Date().toISOString(),
      id: Date.now().toString(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving analysis:', error);
    return NextResponse.json(
      { error: 'Failed to save analysis' },
      { status: 500 }
    );
  }
}
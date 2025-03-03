import { NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/openai';

// Configure route handling
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Validate image type and size
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image.' },
        { status: 400 }
      );
    }

    const MAX_SIZE = 20 * 1024 * 1024; // 20MB limit
    if (image.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Image size too large. Maximum size is 20MB.' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    console.log('Processing image analysis request...', {
      imageType: image.type,
      imageSize: image.size,
      base64Length: base64Image.length
    });

    // Analyze image using OpenAI
    const analysis = await analyzeImage(base64Image);
    
    console.log('Analysis result:', analysis);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('insufficient_quota') || errorMessage.includes('billing')) {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded or billing issue. Please check your account.' },
          { status: 429 }
        );
      }
      if (errorMessage.includes('invalid_api_key') || errorMessage.includes('invalid key')) {
        return NextResponse.json(
          { error: 'Invalid API key configuration.' },
          { status: 500 }
        );
      }
      if (errorMessage.includes('model_not_available') || errorMessage.includes('does not exist')) {
        return NextResponse.json(
          { error: 'The specified model is not available. Please check your OpenAI account access.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze image', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
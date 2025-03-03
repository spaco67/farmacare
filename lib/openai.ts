import OpenAI from 'openai';

// Validate API key format
const apiKey = process.env.OPENAI_API_KEY;
console.log('API Key validation:', {
  isDefined: !!apiKey,
  length: apiKey?.length,
  prefix: apiKey?.substring(0, 7),
  isProjectKey: apiKey?.startsWith('sk-proj'),
});

if (!apiKey) {
  throw new Error('OpenAI API key is not configured');
}

// Remove the sk- check since we're using a project key
// Configure OpenAI client with timeout and max retries
const openai = new OpenAI({
  apiKey: apiKey,
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  baseURL: 'https://api.openai.com/v1', // Explicitly set the base URL
});

// Test the API connection
const testConnection = async () => {
  try {
    const models = await openai.models.list();
    console.log('OpenAI connection test successful:', {
      modelsAvailable: models.data.length > 0,
      hasVisionModel: models.data.some(m => m.id === 'gpt-4-vision-preview')
    });
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
  }
};

// Run the test
testConnection();

// Create or get the assistant
const getAssistant = async () => {
  try {
    // First try to retrieve existing assistant
    const assistants = await openai.beta.assistants.list({
      order: "desc",
      limit: 1,
    });

    const existingAssistant = assistants.data.find(
      (a) => a.name === "Plant Disease Detector"
    );

    if (existingAssistant) {
      return existingAssistant;
    }

    // Create new assistant if none exists
    return await openai.beta.assistants.create({
      name: "Plant Disease Detector",
      description: "An assistant that analyzes plant diseases from images",
      model: "gpt-4-vision-preview",
      tools: [{ type: "code_interpreter" }],
      instructions: "You are an expert in plant disease detection. Analyze images and provide diagnosis in Hausa language.",
    });
  } catch (error) {
    console.error('Error getting/creating assistant:', error);
    throw error;
  }
};

export interface AnalysisResponse {
  hausa: {
    diagnosis: string;
    confidence: number;
    recommendations: string[];
  };
  english: {
    diagnosis: string;
    confidence: number;
    recommendations: string[];
  };
}

export const analyzeImage = async (imageBase64: string): Promise<AnalysisResponse> => {
  try {
    console.log('Starting image analysis...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this plant image and provide diagnosis in both Hausa and English.

Please format your response as a JSON object with the following structure:
{
  "hausa": {
    "diagnosis": "Bayani game da matsalar da aka gano",
    "confidence": number (0-100),
    "recommendations": ["Shawarwari da za'a bi don magance matsalar"]
  },
  "english": {
    "diagnosis": "Description of the identified issue",
    "confidence": number (0-100),
    "recommendations": ["Steps to address the issue"]
  }
}

For Hausa:
1. Menene matsalar da kake gani a wannan shuka?
2. Yaya kake tabbatar da wannan matsalar (confidence 0-100)?
3. Menene shawarar da zaka bawa manomi don magance wannan matsala?
4. Ta yaya za'a kare wannan matsala daga sake faruwa?

For English:
1. What plant disease or issue do you identify in this image?
2. How confident are you in this diagnosis (0-100)?
3. What recommendations would you give to address this issue?
4. How can this issue be prevented in the future?`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    console.log('Received response from OpenAI');

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No analysis received from OpenAI');
    }

    try {
      console.log('OpenAI Response:', content);
      const parsedResponse = JSON.parse(content);
      
      // Validate and ensure all required fields are present
      return {
        hausa: {
          diagnosis: parsedResponse.hausa?.diagnosis || 'Babu bayani',
          confidence: parsedResponse.hausa?.confidence || 0,
          recommendations: parsedResponse.hausa?.recommendations || [],
        },
        english: {
          diagnosis: parsedResponse.english?.diagnosis || 'No description available',
          confidence: parsedResponse.english?.confidence || 0,
          recommendations: parsedResponse.english?.recommendations || [],
        }
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.log('Raw response:', content);
      
      // Fallback: Try to extract information from text format
      const lines = content.split('\n').filter(line => line.trim());
      const halfIndex = Math.ceil(lines.length / 2);
      
      return {
        hausa: {
          diagnosis: lines[0] || 'Babu bayani',
          confidence: 70,
          recommendations: lines.slice(1, halfIndex).filter(Boolean),
        },
        english: {
          diagnosis: lines[halfIndex] || 'No description available',
          confidence: 70,
          recommendations: lines.slice(halfIndex + 1).filter(Boolean),
        }
      };
    }
  } catch (error) {
    console.error('OpenAI API Error:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      type: typeof error
    });
    throw error;
  }
};
import { useState, useCallback } from 'react';
import axios from 'axios';
import type { GarmentAttribute } from '@/types';

// LM Studio API configuration
const LM_STUDIO_URL = 'http://localhost:1234/api/v1/chat';

// Enable mock mode for testing without LM Studio
const USE_MOCK = false;

const CLASSIFICATION_SCHEMA = `{
  "specific_type": "precise item name (e.g., 'Anarkali Kurti', 'Straight Leg Jeans')",
  "category": "Indian ethnic | Western | Accessory",
  "color_primary": "dominant color",
  "style": "aesthetic classification (e.g., 'Casual', 'Formal', 'Traditional', 'Contemporary')",
  "occasions": ["list of applicable contexts"],
  "weather": ["seasonal appropriateness"]
}`;

const RECOMMENDATION_PROMPT = `You are a fashion recommendation expert. Given a garment description, provide a complementary outfit recommendation.

Respond in JSON format:
{
  "recommended_item": "specific type of recommended garment",
  "color_logic": "explanation of why this color combination works",
  "silhouette_logic": "explanation of silhouette compatibility",
  "occasion": "best occasion for this combination",
  "styling_tips": ["tip 1", "tip 2"]
}`;

// LM Studio API Request Type
interface LMStudioChatRequest {
  model: string;
  input: string | Array<{ type: 'text'; content: string } | { type: 'image'; data_url: string }>;
  system_prompt?: string;
  temperature?: number;
  max_output_tokens?: number;
}

// LM Studio API Response Type
interface LMStudioChatResponse {
  model_instance_id: string;
  output: Array<{
    type: 'message' | 'tool_call' | 'reasoning' | 'invalid_tool_call';
    content?: string;
    tool?: string;
    arguments?: Record<string, unknown>;
  }>;
  stats: {
    input_tokens: number;
    total_output_tokens: number;
    tokens_per_second: number;
  };
  response_id?: string;
}

// Mock data for testing without LM Studio
const mockClassifyGarment = async (): Promise<GarmentAttribute> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const categories: Array<'Indian ethnic' | 'Western' | 'Accessory'> = ['Indian ethnic', 'Western', 'Accessory'];
  const colors = ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Pink', 'Purple', 'Orange', 'Maroon'];
  const styles = ['Casual', 'Formal', 'Traditional', 'Contemporary', 'Ethnic', 'Modern'];
  const occasions = ['Daily Wear', 'Party', 'Wedding', 'Office', 'Festival', 'Casual Outing'];
  const weathers = ['Summer', 'Winter', 'All Season', 'Monsoon'];
  
  return {
    specific_type: 'Cotton Kurti',
    category: categories[Math.floor(Math.random() * categories.length)],
    color_primary: colors[Math.floor(Math.random() * colors.length)],
    style: styles[Math.floor(Math.random() * styles.length)],
    occasions: [occasions[Math.floor(Math.random() * occasions.length)]],
    weather: [weathers[Math.floor(Math.random() * weathers.length)]]
  };
};

const mockGenerateCaption = async (): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return 'A beautiful cotton kurti featuring intricate embroidery, V-neck design, and 3/4 sleeves. Perfect for casual and semi-formal occasions.';
};

const mockGenerateRecommendation = async (): Promise<{
  recommended_item: string;
  color_logic: string;
  silhouette_logic: string;
  occasion: string;
  styling_tips: string[];
}> => {
  await new Promise(resolve => setTimeout(resolve, 1200));
  return {
    recommended_item: 'Silk Sharara',
    color_logic: 'The rich silk texture complements the cotton kurti, creating a balanced contrast.',
    silhouette_logic: 'The flared sharara mirrors the flowy nature of the kurti for a cohesive look.',
    occasion: 'Festive occasions and family gatherings',
    styling_tips: ['Add statement earrings', 'Pair with traditional juttis']
  };
};

export function useLMStudio() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classifyGarment = useCallback(async (imageBase64: string): Promise<GarmentAttribute | null> => {
    setIsLoading(true);
    setError(null);

    // Use mock mode if enabled
    if (USE_MOCK) {
      const result = await mockClassifyGarment();
      setIsLoading(false);
      return result;
    }

    try {
      const request: LMStudioChatRequest = {
        model: 'qwen3-vl-2b-instruct',
        system_prompt: `You are a fashion classification expert. Analyze the garment image and provide detailed attributes in JSON format. Schema: ${CLASSIFICATION_SCHEMA}`,
        input: [
          { type: 'text', content: 'Classify this garment and return only the JSON response:' },
          { type: 'image', data_url: `data:image/jpeg;base64,${imageBase64}` }
        ],
        temperature: 0.3,
        max_output_tokens: 512
      };

      const response = await axios.post<LMStudioChatResponse>(LM_STUDIO_URL, request, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 90000
      });

      // Find the message output
      const messageOutput = response.data.output.find(item => item.type === 'message');
      const content = messageOutput?.content;
      
      if (!content) {
        throw new Error('Empty response from LM Studio');
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as GarmentAttribute;
      }

      throw new Error('Invalid JSON response from model');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to classify garment';
      setError(errorMessage);
      console.error('LM Studio classification error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateRecommendation = useCallback(async (garmentDescription: string): Promise<{
    recommended_item: string;
    color_logic: string;
    silhouette_logic: string;
    occasion: string;
    styling_tips: string[];
  } | null> => {
    setIsLoading(true);
    setError(null);

    if (USE_MOCK) {
      const result = await mockGenerateRecommendation();
      setIsLoading(false);
      return result;
    }

    try {
      const request: LMStudioChatRequest = {
        model: 'qwen3-vl-2b-instruct',
        system_prompt: RECOMMENDATION_PROMPT,
        input: `Input garment: ${garmentDescription}\n\nProvide recommendation in JSON format:`,
        temperature: 0.5,
        max_output_tokens: 512
      };

      const response = await axios.post<LMStudioChatResponse>(LM_STUDIO_URL, request, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      const messageOutput = response.data.output.find(item => item.type === 'message');
      const content = messageOutput?.content;
      
      if (!content) {
        throw new Error('Empty response from LM Studio');
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Invalid JSON response from model');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate recommendation';
      setError(errorMessage);
      console.error('LM Studio recommendation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateCaption = useCallback(async (imageBase64: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    if (USE_MOCK) {
      const result = await mockGenerateCaption();
      setIsLoading(false);
      return result;
    }

    try {
      const request: LMStudioChatRequest = {
        model: 'qwen3-vl-2b-instruct',
        system_prompt: 'You are a fashion description expert. Describe this garment in detail including fabric, pattern, neckline, sleeves, fit, and any distinctive features. Keep it under 100 words.',
        input: [
          { type: 'text', content: 'Describe this garment:' },
          { type: 'image', data_url: `data:image/jpeg;base64,${imageBase64}` }
        ],
        temperature: 0.4,
        max_output_tokens: 256
      };

      const response = await axios.post<LMStudioChatResponse>(LM_STUDIO_URL, request, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 90000
      });

      const messageOutput = response.data.output.find(item => item.type === 'message');
      return messageOutput?.content || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate caption';
      setError(errorMessage);
      console.error('LM Studio caption error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    classifyGarment,
    generateRecommendation,
    generateCaption,
    isLoading,
    error
  };
}

import fetch from 'node-fetch';
import { AIProvider, AIModel } from '../interfaces';

export class OpenAIProvider implements AIProvider {
  name = "OpenAI";
  apiKey: string;
  baseUrl = "https://api.openai.com/v1";
  models: AIModel[] = [
    {
      name: "gpt-4o",
      provider: "openai",
      capabilities: [
        { type: "analysis", strength: "excellent" },
        { type: "coding", strength: "excellent" },
        { type: "reasoning", strength: "excellent" },
        { type: "vision", strength: "high" }
      ],
      costPerToken: 0.00003,
      maxTokens: 128000,
      supports: {
        codeGeneration: true,
        analysis: true,
        reasoning: true,
        vision: true,
        functionCalling: true
      }
    },
    {
      name: "gpt-4o-mini",
      provider: "openai",
      capabilities: [
        { type: "analysis", strength: "high" },
        { type: "coding", strength: "high" },
        { type: "reasoning", strength: "high" }
      ],
      costPerToken: 0.000015,
      maxTokens: 128000,
      supports: {
        codeGeneration: true,
        analysis: true,
        reasoning: true,
        vision: false,
        functionCalling: true
      }
    }
  ];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async makeRequest(prompt: string, model: string, options: any = {}): Promise<string> {
    const messages = [];
    
    // Add system message if JSON response is expected
    if (prompt.includes('Return ONLY valid JSON') || prompt.includes('Provide JSON')) {
      messages.push({
        role: 'system',
        content: 'You must respond with valid JSON only. Do not include any markdown formatting, code blocks, or explanatory text. Return only the JSON object.'
      });
    }
    
    messages.push({ role: 'user', content: prompt });
    
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.choices[0].message.content;
  }
}
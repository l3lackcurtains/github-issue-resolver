import fetch from 'node-fetch';
import { AIProvider, AIModel } from '../interfaces';

export class AnthropicProvider implements AIProvider {
  name = "Anthropic";
  apiKey: string;
  baseUrl = "https://api.anthropic.com/v1";
  models: AIModel[] = [
    {
      name: "claude-3-5-sonnet-20241022",
      provider: "anthropic",
      capabilities: [
        { type: "analysis", strength: "excellent" },
        { type: "coding", strength: "excellent" },
        { type: "reasoning", strength: "excellent" },
        { type: "vision", strength: "high" }
      ],
      costPerToken: 0.000015,
      maxTokens: 200000,
      supports: {
        codeGeneration: true,
        analysis: true,
        reasoning: true,
        vision: true,
        functionCalling: true
      }
    },
    {
      name: "claude-3-haiku-20240307",
      provider: "anthropic",
      capabilities: [
        { type: "analysis", strength: "high" },
        { type: "coding", strength: "high" },
        { type: "reasoning", strength: "high" }
      ],
      costPerToken: 0.00000025,
      maxTokens: 200000,
      supports: {
        codeGeneration: true,
        analysis: true,
        reasoning: true,
        vision: false,
        functionCalling: false
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
        role: 'assistant',
        content: 'I will respond with valid JSON only, without any markdown formatting, code blocks, or explanatory text.'
      });
    }
    
    messages.push({ role: 'user', content: prompt });
    
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens || 4000,
        messages,
        temperature: options.temperature || 0.7,
        ...options
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', response.status, errorData);
      throw new Error(`Anthropic API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json() as any;
    return data.content[0].text;
  }
}
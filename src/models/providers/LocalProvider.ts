import fetch from 'node-fetch';
import { AIProvider, AIModel } from '../interfaces';

export class LocalProvider implements AIProvider {
  name = "Local";
  apiKey = "";
  baseUrl: string;
  models: AIModel[] = [
    {
      name: "llama-3.1-8b",
      provider: "local",
      capabilities: [
        { type: "analysis", strength: "medium" },
        { type: "coding", strength: "medium" },
        { type: "reasoning", strength: "medium" }
      ],
      costPerToken: 0,
      maxTokens: 32000,
      supports: {
        codeGeneration: true,
        analysis: true,
        reasoning: true,
        vision: false,
        functionCalling: false
      }
    }
  ];

  constructor(baseUrl: string = "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  async makeRequest(prompt: string, model: string, options: any = {}): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 4000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Local API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.response;
  }
}
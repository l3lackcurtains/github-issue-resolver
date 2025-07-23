import { query, type SDKMessage } from '@anthropic-ai/claude-code';
import { AIProvider, AIModel } from '../interfaces';

export class AnthropicProvider implements AIProvider {
  name = "Claude Code";
  apiKey: string;
  models: AIModel[] = [
    {
      name: "claude-code",
      provider: "anthropic",
      capabilities: [
        { type: "analysis", strength: "excellent" },
        { type: "coding", strength: "excellent" },
        { type: "reasoning", strength: "excellent" }
      ],
      costPerToken: 0.000015,
      maxTokens: 200000,
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
    const messages: SDKMessage[] = [];
    
    try {
      for await (const message of query({
        prompt,
        abortController: new AbortController(),
        options: { 
          maxTurns: options.maxTurns || 1
        }
      })) {
        messages.push(message);
      }
      
      // Return the last message content
      const lastMessage = messages[messages.length - 1];
      return lastMessage?.content || '';
    } catch (error) {
      console.error('Claude Code API error:', error);
      throw new Error(`Claude Code API error: ${error}`);
    }
  }
}
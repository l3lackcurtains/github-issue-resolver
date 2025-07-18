import { AIProvider, AIModel } from "./interfaces";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { AnthropicProvider } from "./providers/AnthropicProvider";
import { LocalProvider } from "./providers/LocalProvider";
import { logger } from "../utils/logger";

export class ModelManager {
  private providers: Map<string, AIProvider> = new Map();
  private modelRegistry: Map<string, AIModel> = new Map();
  private taskModelPreferences: Map<string, string> = new Map();
  private usageStats: Map<
    string,
    { calls: number; tokens: number; cost: number }
  > = new Map();

  constructor() {
    this.initializeDefaultPreferences();
  }

  addProvider(provider: AIProvider) {
    this.providers.set(provider.name.toLowerCase(), provider);

    provider.models.forEach((model) => {
      this.modelRegistry.set(model.name, model);
      this.usageStats.set(model.name, { calls: 0, tokens: 0, cost: 0 });
    });

    logger.info(
      `Added provider: ${provider.name} with ${provider.models.length} models`
    );
  }

  private initializeDefaultPreferences() {
    this.taskModelPreferences.set(
      "analyze-issue",
      "claude-3-5-sonnet-20241022"
    );
    this.taskModelPreferences.set("bug-fix", "gpt-4o");
    this.taskModelPreferences.set(
      "feature-implementation",
      "claude-3-5-sonnet-20241022"
    );
    this.taskModelPreferences.set("documentation-update", "gpt-4o-mini");
    this.taskModelPreferences.set("security-scan", "gpt-4o");
    this.taskModelPreferences.set("test-generation", "claude-3-haiku-20240307");
    this.taskModelPreferences.set("refactoring", "claude-3-5-sonnet-20241022");
    this.taskModelPreferences.set("triage-issues", "gpt-4o-mini");
  }

  getOptimalModel(
    taskType: string,
    requirements?: {
      needsVision?: boolean;
      needsFunctionCalling?: boolean;
      maxCost?: number;
      preferSpeed?: boolean;
    }
  ): string {
    let candidates = Array.from(this.modelRegistry.values());

    if (requirements?.needsVision) {
      candidates = candidates.filter((m) => m.supports.vision);
    }
    if (requirements?.needsFunctionCalling) {
      candidates = candidates.filter((m) => m.supports.functionCalling);
    }
    if (requirements?.maxCost !== undefined) {
      candidates = candidates.filter(
        (m) => m.costPerToken <= requirements.maxCost!
      );
    }

    const preferred = this.taskModelPreferences.get(taskType);
    if (preferred && candidates.find((m) => m.name === preferred)) {
      return preferred;
    }

    candidates.sort((a, b) => {
      const aCapability = a.capabilities.find(
        (c) => c.type === (taskType as any)
      );
      const bCapability = b.capabilities.find(
        (c) => c.type === (taskType as any)
      );

      if (aCapability && bCapability) {
        const strengthOrder = { excellent: 4, high: 3, medium: 2, low: 1 };
        const aScore = strengthOrder[aCapability.strength];
        const bScore = strengthOrder[bCapability.strength];

        if (aScore !== bScore) {
          return bScore - aScore;
        }
      }

      if (requirements?.preferSpeed) {
        return a.costPerToken - b.costPerToken;
      }

      return 0;
    });

    return candidates[0]?.name || "gpt-4o-mini";
  }

  async executeWithModel(
    prompt: string,
    modelName: string,
    options?: any
  ): Promise<{
    response: string;
    model: string;
    tokensUsed: number;
    cost: number;
  }> {
    const model = this.modelRegistry.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }

    const provider = this.providers.get(model.provider);
    if (!provider) {
      throw new Error(`Provider ${model.provider} not configured`);
    }

    logger.info(`Executing request with model: ${modelName}`);

    const startTime = Date.now();
    const response = await provider.makeRequest(prompt, modelName, options);
    const duration = Date.now() - startTime;

    const tokensUsed =
      Math.ceil(prompt.length / 4) + Math.ceil(response.length / 4);
    const cost = tokensUsed * model.costPerToken;

    // Update usage stats
    const stats = this.usageStats.get(modelName)!;
    stats.calls++;
    stats.tokens += tokensUsed;
    stats.cost += cost;

    logger.info(
      `Request completed in ${duration}ms. Tokens: ${tokensUsed}, Cost: $${cost.toFixed(
        6
      )}`
    );

    return {
      response,
      model: modelName,
      tokensUsed,
      cost,
    };
  }

  listAvailableModels(): AIModel[] {
    return Array.from(this.modelRegistry.values());
  }

  getModelInfo(modelName: string): AIModel | undefined {
    return this.modelRegistry.get(modelName);
  }

  setTaskPreference(taskType: string, modelName: string) {
    this.taskModelPreferences.set(taskType, modelName);
    logger.info(`Set task preference: ${taskType} -> ${modelName}`);
  }

  getUsageStats(): {
    model: string;
    calls: number;
    tokens: number;
    cost: number;
  }[] {
    return Array.from(this.usageStats.entries()).map(([model, stats]) => ({
      model,
      ...stats,
    }));
  }

  initializeProviders() {
    if (process.env.OPENAI_API_KEY) {
      this.addProvider(new OpenAIProvider(process.env.OPENAI_API_KEY));
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.addProvider(new AnthropicProvider(process.env.ANTHROPIC_API_KEY));
    }
    if (process.env.LOCAL_LLM_URL) {
      this.addProvider(new LocalProvider(process.env.LOCAL_LLM_URL));
    }
  }
}

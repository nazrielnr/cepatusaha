import { AIProvider } from './ai-provider';
import { OpenAICompatibleProvider } from './providers/openai-compatible';
import type { Bindings } from '../../bindings';

export type ProviderType = 'openai_compatible';

export interface ProviderConfig {
  type: ProviderType;
  apiKey: string;
  model: string;
  priority?: number;
  apiEndpoint: string;
  providerName?: string;
  nodeEnv?: string;
}

export class AIProviderFactory {
  private provider: AIProvider;
  private primaryModel: string;

  constructor(config: ProviderConfig) {
    this.provider = new OpenAICompatibleProvider({
      providerName: config.providerName || 'OpenAI Compatible',
      baseUrl: config.apiEndpoint,
      apiKey: config.apiKey,
      nodeEnv: config.nodeEnv,
    });
    this.primaryModel = config.model;
  }

  getProvider(_type: ProviderType): AIProvider | undefined { return this.provider; }
  getPrimaryProvider(): AIProvider { return this.provider; }
  getPrimaryModel(): string { return this.primaryModel; }
  getModelForProvider(_type: ProviderType): string { return this.primaryModel; }
  getAllProviders(): AIProvider[] { return [this.provider]; }

  async executeWithFallback<T>(operation: (provider: AIProvider) => Promise<T>): Promise<T> {
    return operation(this.provider);
  }

  async checkHealth(): Promise<Record<ProviderType, boolean>> {
    return { openai_compatible: await this.provider.isAvailable() };
  }
}

export async function createFactoryFromEnv(env: Bindings): Promise<AIProviderFactory> {
  const model = env.AI_DEFAULT_MODEL;
  if (!env.AI_BASE_URL || !env.AI_API_KEY || !model) {
    throw new Error('Missing AI_BASE_URL, AI_API_KEY, or AI_DEFAULT_MODEL');
  }
  return new AIProviderFactory({
    type: 'openai_compatible',
    apiKey: env.AI_API_KEY,
    apiEndpoint: env.AI_BASE_URL,
    model,
    nodeEnv: env.NODE_ENV,
  });
}

import { providerManager } from './provider';

export interface GenerateTextOptions {
  prompt: string;
  providerId?: string;
}

export interface GenerateTextResult {
  text: string;
}

/**
 * Generate text using the active AI provider
 */
export async function generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
  const manager = providerManager;
  const providers = await manager.getProviders();
  
  const provider = options.providerId 
    ? providers.find(p => p.id === options.providerId)
    : providers.find(p => p.enabled) || providers[0];

  if (!provider) {
    throw new Error('No AI provider available');
  }

  // Use the provider's generate method
  const response = await manager.callCloudAPI(provider.id, options.prompt);
  
  return {
    text: response.text || response.content || '',
  };
}
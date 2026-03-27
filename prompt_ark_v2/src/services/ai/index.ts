export {
  ProviderManager,
  providerManager,
  getProviders,
  setProviders,
  getActiveProvider,
  migrateProviderSettings,
  callCloudAPI,
  safeParseJSON,
  fetchWithTimeout,
  keepAlive,
} from './provider';

export {
  GeminiWebProvider,
  GeminiAPIProvider,
  OpenAICompatibleProvider,
} from './providers';

export type {
  StoredProvider,
  RuntimeProvider,
  ProviderConfig,
  LegacyProviderSettings,
  FetchWithTimeoutOptions,
  CloudAPICallOptions,
  GeminiWebModelId,
  GeminiWebModelMap,
  GeminiWebCredentials,
  GeminiWebResponse,
  GeminiWebCorrelationTokens,
  AIProviderBase,
  IProviderManager,
  KeepAliveController,
  SafeParseResult,
  APIError,
  NotLoggedInError,
} from './types';

export {
  GeminiWebProvider as GeminiWeb,
  callGeminiWeb,
  isGeminiWebAvailable,
  fetchGeminiWebCredentials,
} from './providers/gemini-web';

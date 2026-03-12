// lib/ai/image-prompt.js - Image → Prompt generation
// Analyzes images and generates structured prompts for AI image generation

import { fetchWithTimeout, getActiveProvider, keepAlive, safeParseJSON } from './provider.js';
import { callGeminiWeb } from '../gemini-web.js';
import { loadPrompt } from '../prompt-loader.js';

// Cache management
const CACHE_KEY = 'imagePromptCache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Get cache from storage
async function getCache() {
  try {
    const result = await chrome.storage.local.get(CACHE_KEY);
    return result[CACHE_KEY] || {};
  } catch {
    return {};
  }
}

// Set cache to storage
async function setCache(cache) {
  await chrome.storage.local.set({ [CACHE_KEY]: cache });
}

// Generate cache key from image URL and model
function generateCacheKey(imageUrl, modelId) {
  return btoa(`${imageUrl}:${modelId}`).slice(0, 32);
}

// Check if cache entry is valid
function isCacheValid(entry) {
  return entry && (Date.now() - entry.timestamp) < CACHE_TTL;
}

// Generate image prompt with AI
export async function generateImagePrompt(imageUrl, imageModelId = null) {
  const stopKeepAlive = keepAlive();
  
  try {
    // Get active provider
    let provider;
    if (imageModelId) {
      const providers = await chrome.runtime.sendMessage({ type: 'GET_PROVIDERS' });
      provider = providers?.providers?.find(p => p.id === imageModelId);
    }
    if (!provider) {
      provider = await getActiveProvider();
    }
    
    if (!provider) {
      throw new Error('No AI provider configured');
    }
    
    // Check cache
    const cacheKey = generateCacheKey(imageUrl, provider.id);
    const cache = await getCache();
    if (isCacheValid(cache[cacheKey])) {
      console.log('[ImagePrompt] Using cached result');
      return cache[cacheKey].result;
    }
    
    // Load prompt template
    const systemPrompt = await loadPrompt('image-to-prompt');
    
    let result = null;
    
    if (provider.type === 'gemini') {
      result = await generateWithGeminiAPI(imageUrl, systemPrompt, provider);
    } else if (provider.type === 'gemini-web') {
      result = await generateWithGeminiWeb(imageUrl, systemPrompt);
    } else if (provider.type === 'openai') {
      result = await generateWithOpenAI(imageUrl, systemPrompt, provider);
    } else {
      throw new Error(`Unsupported provider type: ${provider.type}`);
    }
    
    // Cache result
    cache[cacheKey] = {
      result,
      timestamp: Date.now()
    };
    await setCache(cache);
    
    return result;
  } finally {
    stopKeepAlive();
  }
}

// Generate with Gemini API
async function generateWithGeminiAPI(imageUrl, systemPrompt, provider) {
  const model = provider.model || 'gemini-2.0-flash-exp';
  
  // Check if it's a data URL or regular URL
  const isDataUrl = imageUrl.startsWith('data:');
  
  let requestBody;
  if (isDataUrl) {
    // For data URLs, extract mime type and base64 data
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Invalid data URL format');
    }
    const [, mimeType, base64Data] = match;
    requestBody = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: 'Analyze this image and generate a structured prompt following the output format.' }
        ]
      }],
      generationConfig: {
        responseModalities: ['TEXT'],
        responseMimeType: 'application/json'
      }
    };
  } else {
    // For regular URLs
    requestBody = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{
        parts: [
          { fileData: { mimeType: 'image/jpeg', fileUri: imageUrl } },
          { text: 'Analyze this image and generate a structured prompt following the output format.' }
        ]
      }],
      generationConfig: {
        responseModalities: ['TEXT'],
        responseMimeType: 'application/json'
      }
    };
  }
  
  const resp = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': provider.apiKey 
      },
      body: JSON.stringify(requestBody)
    },
    60000 // 60 second timeout
  );
  
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini API ${resp.status}: ${errText}`);
  }
  
  const data = await resp.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!raw) {
    throw new Error('Empty response from Gemini API');
  }
  
  return parseResult(raw);
}

// Generate with Gemini Web (free, no API key)
async function generateWithGeminiWeb(imageUrl, systemPrompt) {
  // For Gemini Web, we need to use text-based approach since we can't send images directly
  // We'll describe the image using the URL
  const prompt = `${systemPrompt}

Please analyze the image at this URL and generate a structured prompt:
${imageUrl}

Return valid JSON only.`;
  
  let result = await callGeminiWeb(prompt);
  
  // Clean up response
  result = result.replace(/https?:\/\/[^\s]*googleusercontent\.com\/image_generation_content[^\s]*/g, '').trim();
  result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  
  const jsonStart = result.indexOf('{');
  const jsonEnd = result.lastIndexOf('}');
  
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Could not parse JSON from Gemini Web response');
  }
  
  return parseResult(result.slice(jsonStart, jsonEnd + 1));
}

// Generate with OpenAI compatible API
async function generateWithOpenAI(imageUrl, systemPrompt, provider) {
  const model = provider.model || 'gpt-4o';
  
  // For OpenAI, we need to fetch the image and convert to base64 if it's a URL
  let imageContent;
  if (imageUrl.startsWith('data:')) {
    imageContent = imageUrl;
  } else {
    try {
      const imgResp = await fetchWithTimeout(imageUrl, {}, 10000);
      if (!imgResp.ok) throw new Error('Failed to fetch image');
      const blob = await imgResp.blob();
      const base64 = await blobToBase64(blob);
      imageContent = `data:${blob.type};base64,${base64}`;
    } catch (e) {
      throw new Error(`Failed to load image: ${e.message}`);
    }
  }
  
  const resp = await fetchWithTimeout(
    `${provider.apiUrl}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this image and generate a structured prompt:' },
              { type: 'image_url', image_url: { url: imageContent } }
            ]
          }
        ],
        response_format: { type: 'json_object' }
      })
    },
    60000
  );
  
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`OpenAI API ${resp.status}: ${errText}`);
  }
  
  const data = await resp.json();
  const raw = data.choices?.[0]?.message?.content;
  
  if (!raw) {
    throw new Error('Empty response from OpenAI API');
  }
  
  return parseResult(raw);
}

// Convert blob to base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Parse and validate result
function parseResult(raw) {
  let parsed;
  try {
    parsed = safeParseJSON(raw);
  } catch (e) {
    // Try to repair truncated JSON
    const repaired = repairJson(raw);
    parsed = safeParseJSON(repaired);
  }
  
  // Validate required fields
  const required = ['subject', 'style', 'lighting', 'color_scheme', 'composition', 'details', 'prompt'];
  const missing = required.filter(field => !(field in parsed));
  
  if (missing.length > 0) {
    console.warn('[ImagePrompt] Missing fields:', missing);
    // Fill in missing fields with defaults
    missing.forEach(field => {
      parsed[field] = field === 'prompt' ? '' : 'Not specified';
    });
  }
  
  return parsed;
}

// Attempt to repair truncated JSON
function repairJson(raw) {
  let repaired = raw;
  const lastBrace = repaired.lastIndexOf('}');
  const lastBracket = repaired.lastIndexOf(']');
  const cutPoint = Math.max(lastBrace, lastBracket);
  
  if (cutPoint > 0) {
    repaired = repaired.slice(0, cutPoint + 1);
    let braces = 0, brackets = 0;
    for (const ch of repaired) {
      if (ch === '{') braces++;
      else if (ch === '}') braces--;
      else if (ch === '[') brackets++;
      else if (ch === ']') brackets--;
    }
    repaired += ']'.repeat(Math.max(0, brackets)) + '}'.repeat(Math.max(0, braces));
  }
  
  return repaired;
}

// Clear expired cache entries
export async function clearExpiredCache() {
  const cache = await getCache();
  const now = Date.now();
  let hasExpired = false;
  
  for (const key in cache) {
    if ((now - cache[key].timestamp) > CACHE_TTL) {
      delete cache[key];
      hasExpired = true;
    }
  }
  
  if (hasExpired) {
    await setCache(cache);
  }
}

// Clear all cache
export async function clearAllCache() {
  await chrome.storage.local.remove(CACHE_KEY);
}

import type { Prompt } from '@/types/prompt';
import { productivityPrompts } from './productivity';
import { writingPrompts } from './writing';
import { codingPrompts } from './coding';
import { educationPrompts } from './education';
import { creativePrompts } from './creative';
import { analysisPrompts } from './analysis';

export { productivityPrompts } from './productivity';
export { writingPrompts } from './writing';
export { codingPrompts } from './coding';
export { educationPrompts } from './education';
export { creativePrompts } from './creative';
export { analysisPrompts } from './analysis';

export const defaultPrompts: Prompt[] = [
  ...productivityPrompts,
  ...writingPrompts,
  ...codingPrompts,
  ...educationPrompts,
  ...creativePrompts,
  ...analysisPrompts,
];

export const promptsByCategory = {
  productivity: productivityPrompts,
  writing: writingPrompts,
  coding: codingPrompts,
  education: educationPrompts,
  creative: creativePrompts,
  analysis: analysisPrompts,
};

export const defaultPromptsCount = defaultPrompts.length;

export const categoryCounts = {
  productivity: productivityPrompts.length,
  writing: writingPrompts.length,
  coding: codingPrompts.length,
  education: educationPrompts.length,
  creative: creativePrompts.length,
  analysis: analysisPrompts.length,
};

import type { Prompt } from '@types';

export interface ShareOptions {
  promptId: string;
  platform: 'x' | 'reddit' | 'zhihu' | 'wechat' | 'xiaohongshu' | 'linkedin';
  providerId: string;
}

export interface PackShareOptions {
  promptIds: string[];
  title: string;
  providerId: string;
}

export async function generateShareContent(
  prompt: Prompt,
  platform: ShareOptions['platform']
): Promise<{ title: string; content: string; url?: string }> {
  const baseUrl = 'https://promptark.app';
  const promptUrl = `${baseUrl}/p/${prompt.id}`;

  const templates: Record<ShareOptions['platform'], () => { title: string; content: string }> = {
    x: () => ({
      title: `Check out this prompt: ${prompt.title}`,
      content: `${prompt.content.slice(0, 200)}${prompt.content.length > 200 ? '...' : ''}\n\n#PromptArk #AI`,
    }),
    reddit: () => ({
      title: `[Prompt] ${prompt.title}`,
      content: `${prompt.content}\n\n---\nShared via [Prompt Ark](${baseUrl})`,
    }),
    zhihu: () => ({
      title: `分享一个实用的 AI Prompt：${prompt.title}`,
      content: `${prompt.content}\n\n---\n使用 Prompt Ark 分享`,
    }),
    wechat: () => ({
      title: prompt.title,
      content: `${prompt.content.slice(0, 500)}${prompt.content.length > 500 ? '...' : ''}`,
    }),
    xiaohongshu: () => ({
      title: `💡 AI Prompt 分享 | ${prompt.title}`,
      content: `${prompt.content.slice(0, 300)}\n\n#PromptArk #AI #效率工具`,
    }),
    linkedin: () => ({
      title: `AI Prompt: ${prompt.title}`,
      content: `Sharing a useful AI prompt I created:\n\n${prompt.content.slice(0, 300)}...`,
    }),
  };

  const template = templates[platform]();
  return { ...template, url: promptUrl };
}

export function openShareWindow(
  platform: ShareOptions['platform'],
  content: { title: string; content: string; url?: string }
): void {
  const urls: Record<ShareOptions['platform'], string> = {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(content.title + '\n\n' + content.content)}`,
    reddit: `https://www.reddit.com/submit?title=${encodeURIComponent(content.title)}&text=${encodeURIComponent(content.content)}`,
    zhihu: `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(content.title)}`,
    wechat: '',
    xiaohongshu: '',
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(content.url || '')}`,
  };

  const url = urls[platform];
  if (url) {
    window.open(url, '_blank', 'width=600,height=400');
  } else if (platform === 'wechat' || platform === 'xiaohongshu') {
    // Copy to clipboard for manual sharing
    navigator.clipboard.writeText(`${content.title}\n\n${content.content}`);
    alert('内容已复制到剪贴板，请手动粘贴分享');
  }
}

export async function sharePromptPack(
  options: PackShareOptions,
  getPrompt: (id: string) => Promise<Prompt | null>
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (options.promptIds.length === 0) {
    return { success: false, error: 'packSelectOne' };
  }

  const prompts: Prompt[] = [];
  for (const id of options.promptIds) {
    const prompt = await getPrompt(id);
    if (prompt) {
      prompts.push(prompt);
    }
  }

  if (prompts.length === 0) {
    return { success: false, error: 'No valid prompts found' };
  }

  // TODO: Upload to GitHub Gist or other sharing service
  // For now, return a local URL
  const packData = {
    title: options.title,
    prompts: prompts.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      category: p.category,
      tags: p.tags,
    })),
    createdAt: Date.now(),
  };

  // Create a data URL for the pack
  const dataUrl = `data:application/json;base64,${btoa(JSON.stringify(packData, null, 2))}`;

  return {
    success: true,
    url: dataUrl,
  };
}

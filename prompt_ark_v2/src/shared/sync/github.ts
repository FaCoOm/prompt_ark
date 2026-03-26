import type { SyncEngineAdapter, SyncPayload, SyncResult } from '@types';

export interface GistConfig {
  token: string;
  gistId?: string;
}

export class GitHubGistClient implements SyncEngineAdapter {
  readonly name = 'gist';
  readonly displayName = 'GitHub Gist';

  constructor(private config: GistConfig) {}

  async isConfigured(): Promise<boolean> {
    return !!this.config.token;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.config.token) {
      return { success: false, error: 'ERR_GIST_NO_TOKEN' };
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${this.config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return { success: false, error: 'GitHub API authentication failed' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async pull(): Promise<SyncResult> {
    if (!this.config.token) {
      return { success: false, action: 'none', error: 'ERR_GIST_NO_TOKEN' };
    }

    if (!this.config.gistId) {
      return { success: false, action: 'none', error: 'ERR_GIST_EMPTY_ID_AUTO_CREATE' };
    }

    try {
      const response = await fetch(
        `https://api.github.com/gists/${this.config.gistId}`,
        {
          headers: {
            Authorization: `token ${this.config.token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, action: 'none', error: 'ERR_GIST_NO_CONTENT' };
        }
        return { success: false, action: 'none', error: `HTTP ${response.status}` };
      }

      const gist = await response.json();
      const file = gist.files['prompt-ark-data.json'];

      if (!file || !file.content) {
        return { success: false, action: 'none', error: 'ERR_GIST_NO_CONTENT' };
      }

      try {
        const data = JSON.parse(file.content) as SyncPayload;
        return {
          success: true,
          action: 'pulled',
          data,
        };
      } catch {
        return { success: false, action: 'none', error: 'ERR_GIST_PARSE_FAILED' };
      }
    } catch (error) {
      return {
        success: false,
        action: 'none',
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async push(data: SyncPayload): Promise<SyncResult> {
    if (!this.config.token) {
      return { success: false, action: 'none', error: 'ERR_GIST_NO_TOKEN' };
    }

    const content = JSON.stringify(data, null, 2);

    try {
      if (this.config.gistId) {
        // Update existing gist
        const response = await fetch(
          `https://api.github.com/gists/${this.config.gistId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `token ${this.config.token}`,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              files: {
                'prompt-ark-data.json': {
                  content,
                },
              },
            }),
          }
        );

        if (!response.ok) {
          return { success: false, action: 'none', error: `HTTP ${response.status}` };
        }

        return { success: true, action: 'pushed' };
      } else {
        // Create new gist
        const response = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: {
            Authorization: `token ${this.config.token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: 'Prompt Ark Data Backup',
            public: false,
            files: {
              'prompt-ark-data.json': {
                content,
              },
            },
          }),
        });

        if (!response.ok) {
          return { success: false, action: 'none', error: `HTTP ${response.status}` };
        }

        const gist = await response.json();
        this.config.gistId = gist.id;

        return { success: true, action: 'pushed' };
      }
    } catch (error) {
      return {
        success: false,
        action: 'none',
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async sync(localData: SyncPayload): Promise<SyncResult> {
    const pullResult = await this.pull();

    if (!pullResult.success) {
      if (pullResult.error === 'ERR_GIST_NO_CONTENT' || pullResult.error === 'ERR_GIST_EMPTY_ID_AUTO_CREATE') {
        // No remote data, push local
        return this.push(localData);
      }
      return pullResult;
    }

    // Merge remote data with local data (simple last-write-wins)
    const remoteData = pullResult.data!;
    const merged: SyncPayload = {
      ...localData,
      prompts: this.mergePrompts(localData.prompts, remoteData.prompts),
      version: Math.max(localData.version, remoteData.version) + 1,
      exportedAt: Date.now(),
    };

    return this.push(merged);
  }

  async createGist(): Promise<string> {
    const data: SyncPayload = {
      prompts: [],
      settings: {
        language: 'zh-CN',
        theme: 'auto',
        syncEngine: 'gist',
        imagePromptEnabled: false,
        preferences: {
          listView: 'grid',
          pageSize: 20,
          sortBy: 'updated',
          sortOrder: 'desc',
        },
      },
      categories: [],
      version: 1,
      exportedAt: Date.now(),
    };

    const result = await this.push(data);
    if (!result.success) {
      throw new Error(result.error);
    }

    return this.config.gistId!;
  }

  private mergePrompts(local: SyncPayload['prompts'], remote: SyncPayload['prompts']): SyncPayload['prompts'] {
    const merged = new Map<string, SyncPayload['prompts'][0]>();

    for (const prompt of local) {
      merged.set(prompt.id, prompt);
    }

    for (const prompt of remote) {
      const existing = merged.get(prompt.id);
      if (!existing || prompt.updatedAt > existing.updatedAt) {
        merged.set(prompt.id, prompt);
      }
    }

    return Array.from(merged.values());
  }
}

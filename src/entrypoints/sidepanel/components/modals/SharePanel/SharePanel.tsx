import type { JSX } from 'solid-js';
import type { Prompt } from '@/shared/types/prompt';

export interface SharePanelProps {
  prompt: Prompt;
  onCopyLink: () => void;
  onCopyJSON: () => void;
}

function generateShareText(prompt: Prompt): string {
  const truncatedContent =
    prompt.content.length > 200 ? `${prompt.content.substring(0, 200)  }...` : prompt.content;

  return `Check out this prompt: "${prompt.title}"

${truncatedContent}

#${prompt.category}${prompt.tags.length > 0 ? ` #${  prompt.tags.join(' #')}` : ''}`;
}

export function SharePanel(props: SharePanelProps): JSX.Element {
  const shareText = () => generateShareText(props.prompt);
  const shareUrl = () => `${window.location.origin}/prompt/${props.prompt.id}`;

  const handlePublishToHub = () => {
    const url = `https://prompt-ark.hub/publish?promptId=${encodeURIComponent(props.prompt.id)}`;
    window.open(url, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(shareText());
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank');
  };

  const handleShareReddit = () => {
    const title = encodeURIComponent(`Check out this prompt: "${props.prompt.title}"`);
    const text = encodeURIComponent(shareText());
    const url = `https://www.reddit.com/submit?title=${title}&text=${text}`;
    window.open(url, '_blank');
  };

  const handleShareZhihu = () => {
    const title = encodeURIComponent(`分享一个实用的Prompt: ${props.prompt.title}`);
    const url = `https://www.zhihu.com/search?type=content&q=${title}`;
    window.open(url, '_blank');
  };

  const handleShareWeChat = () => {
    navigator.clipboard.writeText(shareText()).then(() => {
      alert('Content copied! Paste in WeChat to share.');
    });
  };

  const handleShareXiaohongshu = () => {
    const xhsText = `${props.prompt.title}\n\n${props.prompt.content.substring(0, 300)}${props.prompt.content.length > 300 ? '...' : ''}\n\n#PromptArk #${props.prompt.category}`;
    navigator.clipboard.writeText(xhsText).then(() => {
      alert('Content copied! Paste in Xiaohongshu to share.');
    });
  };

  const handleShareLinkedIn = () => {
    const title = encodeURIComponent(`Check out this prompt: "${props.prompt.title}"`);
    const summary = encodeURIComponent(shareText());
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl())}&title=${title}&summary=${summary}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl()).then(() => {
      props.onCopyLink();
    });
  };

  const handleCopyJSON = () => {
    const jsonData = JSON.stringify(
      {
        id: props.prompt.id,
        title: props.prompt.title,
        content: props.prompt.content,
        category: props.prompt.category,
        tags: props.prompt.tags,
        shortcut: props.prompt.shortcut,
        variables: props.prompt.variables,
      },
      null,
      2
    );
    navigator.clipboard.writeText(jsonData).then(() => {
      props.onCopyJSON();
    });
  };

  return (
    <div class="share-panel">
      <div class="share-grid">
        <button
          type="button"
          class="share-btn"
          onClick={handlePublishToHub}
          title="Publish to Prompt Ark Hub"
        >
          <span class="share-icon">🚀</span>
          <span class="share-label">Publish to Hub</span>
        </button>

        <button
          type="button"
          class="share-btn"
          onClick={handleShareTwitter}
          title="Share on Twitter/X"
        >
          <span class="share-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </span>
          <span class="share-label">Twitter/X</span>
        </button>

        <button type="button" class="share-btn" onClick={handleShareReddit} title="Share on Reddit">
          <span class="share-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
            </svg>
          </span>
          <span class="share-label">Reddit</span>
        </button>

        <button type="button" class="share-btn" onClick={handleShareZhihu} title="Share on Zhihu">
          <span class="share-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M5.721 0C2.251 0 0 2.25 0 5.719V18.28C0 21.751 2.252 24 5.721 24h12.56C21.751 24 24 21.75 24 18.281V5.72C24 2.249 21.75 0 18.281 0zm1.964 4.078c-.271.73-.5 1.434-.68 2.11h4.587c.545-.006.445 1.168.445 1.171H9.384a58.104 58.104 0 0 1-.112 3.797h2.972c.388.023.393 1.251.393 1.251H9.183c.062 1.191.328 2.559.837 4.097.557 1.68 1.59 3.436 2.705 4.789h-3.24c-.024-.025-.053-.052-.084-.084-.67-.707-1.595-1.768-2.376-3.229-.63-1.168-1.03-2.428-1.244-3.666H3.775c-.063-1.097.727-1.25.727-1.25h2.052c-.04-1.252.044-2.54.13-3.797H4.632c-.085-1.033.574-1.171.574-1.171h2.166a61.652 61.652 0 0 1 .672-2.11c.206-.609.584-1.312 1.084-2.028zm7.858 5.927c.327 0 .697.076 1.108.23l-.318 1.007c-.275-.127-.555-.191-.838-.191-.413 0-.773.16-1.082.479-.308.318-.551.72-.726 1.206-.137.387-.206.79-.206 1.21 0 .508.112.892.337 1.152.225.26.527.39.905.39.303 0 .639-.072 1.007-.218l.25.959c-.396.19-.847.285-1.353.285-.726 0-1.296-.226-1.712-.679-.416-.453-.624-1.056-.624-1.809 0-.713.147-1.364.44-1.953.294-.589.68-1.047 1.159-1.375.479-.327.963-.492 1.453-.492zm-2.17 1.12h1.513l-1.915 6.26h-1.513l1.915-6.26zm2.372 4.326l.874-2.814h1.513l-1.915 6.26h-1.513l.513-1.64c.172-.56.335-1.086.49-1.58l-.005-.001-.444 1.43h-1.37l1.025-3.332.222-.81c.03-.112.063-.239.1-.381l.083-.35.024-.112h-.02z" />
            </svg>
          </span>
          <span class="share-label">知乎</span>
        </button>

        <button type="button" class="share-btn" onClick={handleShareWeChat} title="Share on WeChat">
          <span class="share-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.49.49 0 0 1 .177-.554C23.028 18.572 24 16.927 24 15.093c0-3.248-3.099-6.183-7.062-6.235zm-2.083 3.003c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.842 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z" />
            </svg>
          </span>
          <span class="share-label">微信</span>
        </button>

        <button
          type="button"
          class="share-btn"
          onClick={handleShareXiaohongshu}
          title="Share on Xiaohongshu"
        >
          <span class="share-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.455 15.114a.59.59 0 0 1-.425.176H7.97a.59.59 0 0 1-.59-.59V9.3c0-.326.264-.59.59-.59h8.06c.326 0 .59.264.59.59v5.4a.59.59 0 0 1-.165.414zm-3.035-3.114l-1.42-2.048a.198.198 0 0 0-.327 0l-1.42 2.048a.198.198 0 0 0 .163.312h2.841a.198.198 0 0 0 .163-.312z" />
            </svg>
          </span>
          <span class="share-label">小红书</span>
        </button>

        <button
          type="button"
          class="share-btn"
          onClick={handleShareLinkedIn}
          title="Share on LinkedIn"
        >
          <span class="share-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </span>
          <span class="share-label">LinkedIn</span>
        </button>

        <button type="button" class="share-btn" onClick={handleCopyLink} title="Copy Link">
          <span class="share-icon">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </span>
          <span class="share-label">Copy Link</span>
        </button>

        <button type="button" class="share-btn" onClick={handleCopyJSON} title="Copy JSON">
          <span class="share-icon">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </span>
          <span class="share-label">Copy JSON</span>
        </button>
      </div>
    </div>
  );
}

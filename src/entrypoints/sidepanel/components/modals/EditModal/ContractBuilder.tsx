import { For } from "solid-js";
import type { JSX } from 'solid-js';

export interface ContractBuilderProps {
  outputFormat: string;
  lengthLimit: number;
  tone: string;
  excludedContent: string;
  onOutputFormatChange: (format: string) => void;
  onLengthLimitChange: (limit: number) => void;
  onToneChange: (tone: string) => void;
  onExcludedContentChange: (content: string) => void;
}

const OUTPUT_FORMATS = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'json', label: 'JSON' },
  { value: 'table', label: 'Table' },
  { value: 'code', label: 'Code' },
  { value: 'text', label: 'Plain Text' },
  { value: 'html', label: 'HTML' },
];

const TONES = [
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'technical', label: 'Technical' },
];

export function ContractBuilder(props: ContractBuilderProps): JSX.Element {
  const handleLengthLimitChange = (e: Event & { currentTarget: HTMLInputElement }) => {
    props.onLengthLimitChange(parseInt(e.currentTarget.value, 10));
  };

  const handleExcludedContentChange = (e: Event & { currentTarget: HTMLTextAreaElement }) => {
    props.onExcludedContentChange(e.currentTarget.value);
  };

  return (
    <div class="contract-builder">
      <div class="form-group format-selector">
        <label for="output-format">Output Format</label>
        <select
          id="output-format"
          value={props.outputFormat}
          onChange={e => props.onOutputFormatChange(e.currentTarget.value)}
          class="settings-select"
        >
          <For each={OUTPUT_FORMATS}>{format => (
            <option value={format.value}>{format.label}</option>
          )}</For>
        </select>
      </div>

      <div class="form-group">
        <label for="length-limit">
          Length Limit: <span class="length-value">{props.lengthLimit}</span> characters
        </label>
        <input
          id="length-limit"
          type="range"
          min="100"
          max="4000"
          step="100"
          value={props.lengthLimit}
          onInput={handleLengthLimitChange}
          class="length-slider"
        />
        <div class="length-range-hints">
          <span>100</span>
          <span>4000</span>
        </div>
      </div>

      <div class="form-group tone-selector">
        <label for="tone-select">Tone</label>
        <select
          id="tone-select"
          value={props.tone}
          onChange={e => props.onToneChange(e.currentTarget.value)}
          class="settings-select"
        >
          <For each={TONES}>{tone => (
            <option value={tone.value}>{tone.label}</option>
          )}</For>
        </select>
      </div>

      <div class="form-group">
        <label for="excluded-content">Excluded Content</label>
        <textarea
          id="excluded-content"
          value={props.excludedContent}
          onInput={handleExcludedContentChange}
          placeholder="Enter topics, phrases, or content to avoid..."
          rows={4}
          class="settings-textarea"
        />
        <span class="help-text">List anything that should not appear in the output</span>
      </div>
    </div>
  );
}

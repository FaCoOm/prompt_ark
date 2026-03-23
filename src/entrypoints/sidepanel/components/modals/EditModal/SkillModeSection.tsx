import type { JSX } from 'solid-js';
import { For } from 'solid-js';
import { Button } from '../../ui/Button';

export interface SkillModeSectionProps {
  enabled: boolean;
  systemPrompt: string;
  knowledgeFragments: string[];
  onEnabledChange: (enabled: boolean) => void;
  onSystemPromptChange: (value: string) => void;
  onFragmentsChange: (fragments: string[]) => void;
}

export function SkillModeSection(props: SkillModeSectionProps): JSX.Element {
  const handleToggle = () => {
    props.onEnabledChange(!props.enabled);
  };

  const handleSystemPromptChange = (e: InputEvent & { currentTarget: HTMLTextAreaElement }) => {
    props.onSystemPromptChange(e.currentTarget.value);
  };

  const handleFragmentChange = (index: number, value: string) => {
    const newFragments = [...props.knowledgeFragments];
    newFragments[index] = value;
    props.onFragmentsChange(newFragments);
  };

  const handleAddFragment = () => {
    props.onFragmentsChange([...props.knowledgeFragments, '']);
  };

  const handleRemoveFragment = (index: number) => {
    const newFragments = props.knowledgeFragments.filter((_, i) => i !== index);
    props.onFragmentsChange(newFragments);
  };

  return (
    <div class="skill-mode-section">
      <div class="form-group">
        <label class="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={props.enabled}
            onChange={handleToggle}
            class="toggle-checkbox"
          />
          <span>Enable Skill Mode</span>
        </label>
      </div>

      {props.enabled && (
        <>
          <div class="form-group">
            <label for="system-prompt">System Prompt</label>
            <textarea
              id="system-prompt"
              class="settings-input system-prompt-textarea"
              value={props.systemPrompt}
              onInput={handleSystemPromptChange}
              placeholder="Enter system prompt for skill mode..."
              rows={4}
            />
          </div>

          <div class="form-group">
            <label for="knowledge-fragments-list">Knowledge Fragments</label>
            <div id="knowledge-fragments-list" class="knowledge-fragments-list">
              <For each={props.knowledgeFragments}>
                {(fragment, index) => (
                  <div class="knowledge-fragment">
                    <textarea
                      class="settings-input fragment-textarea"
                      value={fragment}
                      onInput={e => handleFragmentChange(index(), e.currentTarget.value)}
                      placeholder="Enter knowledge fragment..."
                      rows={3}
                    />
                    <Button
                      variant="danger"
                      onClick={() => handleRemoveFragment(index())}
                      className="remove-fragment-btn"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </For>
            </div>
            <Button variant="secondary" onClick={handleAddFragment} className="add-fragment-btn">
              Add Fragment
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

import { createSignal, Show, For } from 'solid-js';
import type { JSX } from 'solid-js';
import { Button } from '../ui/Button';

export interface Skill {
  id: string;
  name: string;
  content: string;
  createdAt: number;
}

interface SkillManagerProps {
  skills: Skill[];
  onDeleteSkill: (id: string) => void;
}

export function SkillManager(props: SkillManagerProps): JSX.Element {
  const [selectedSkill, setSelectedSkill] = createSignal<Skill | null>(null);

  const handleBack = () => {
    setSelectedSkill(null);
  };

  const handleDelete = () => {
    const skill = selectedSkill();
    if (skill) {
      props.onDeleteSkill(skill.id);
      setSelectedSkill(null);
    }
  };

  return (
    <div class="skill-manager">
      <Show
        when={selectedSkill()}
        fallback={
          <div class="skill-list">
            <Show when={props.skills.length === 0}>
              <div class="empty-state">No skills available</div>
            </Show>
            <For each={props.skills}>
              {skill => (
                <button type="button" class="skill-item" onClick={() => setSelectedSkill(skill)}>
                  <span class="skill-name">{skill.name}</span>
                  <span class="skill-date">{new Date(skill.createdAt).toLocaleDateString()}</span>
                </button>
              )}
            </For>
          </div>
        }
      >
        {skill => {
          const s = skill();
          return (
            <div class="skill-detail">
              <div class="detail-header">
                <Button variant="ghost" onClick={handleBack}>
                  ← Back
                </Button>
                <h3 class="detail-title">{s.name}</h3>
                <Button variant="danger" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
              <div class="skill-content">
                <pre class="content-pre">{s.content}</pre>
              </div>
            </div>
          );
        }}
      </Show>
    </div>
  );
}

export default SkillManager;

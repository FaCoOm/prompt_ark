import { createSignal } from 'solid-js';
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

  if (!selectedSkill()) {
    return (
      <div class="skill-manager">
        <div class="skill-list">
          {props.skills.length === 0 ? (
            <div class="empty-state">No skills available</div>
          ) : (
            props.skills.map(skill => (
              <button type="button" class="skill-item" onClick={() => setSelectedSkill(skill)}>
                <span class="skill-name">{skill.name}</span>
                <span class="skill-date">{new Date(skill.createdAt).toLocaleDateString()}</span>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  const skill = selectedSkill()!;
  return (
    <div class="skill-manager">
      <div class="skill-detail">
        <div class="detail-header">
          <Button variant="ghost" onClick={handleBack}>
            ← Back
          </Button>
          <h3 class="detail-title">{skill.name}</h3>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
        <div class="skill-content">
          <pre class="content-pre">{skill.content}</pre>
        </div>
      </div>
    </div>
  );
}

export default SkillManager;

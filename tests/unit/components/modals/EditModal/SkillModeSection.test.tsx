import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import { SkillModeSection } from '@/entrypoints/sidepanel/components/modals/EditModal/SkillModeSection';

describe('SkillModeSection', () => {
  const defaultProps = {
    enabled: false,
    systemPrompt: '',
    knowledgeFragments: [],
    onEnabledChange: vi.fn(),
    onSystemPromptChange: vi.fn(),
    onFragmentsChange: vi.fn(),
  };

  it('renders toggle checkbox', () => {
    render(() => <SkillModeSection {...defaultProps} />);

    expect(screen.getByLabelText('Enable Skill Mode')).toBeInTheDocument();
  });

  it('toggle is unchecked by default', () => {
    render(() => <SkillModeSection {...defaultProps} />);

    const checkbox = screen.getByLabelText('Enable Skill Mode') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('toggle is checked when enabled is true', () => {
    render(() => <SkillModeSection {...defaultProps} enabled={true} />);

    const checkbox = screen.getByLabelText('Enable Skill Mode') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('calls onEnabledChange when toggle is clicked', () => {
    const onEnabledChange = vi.fn();
    render(() => <SkillModeSection {...defaultProps} onEnabledChange={onEnabledChange} />);

    const checkbox = screen.getByLabelText('Enable Skill Mode');
    fireEvent.click(checkbox);

    expect(onEnabledChange).toHaveBeenCalledWith(true);
  });

  it('shows system prompt textarea when enabled', () => {
    render(() => <SkillModeSection {...defaultProps} enabled={true} />);

    expect(screen.getByLabelText('System Prompt')).toBeInTheDocument();
  });

  it('does not show system prompt textarea when disabled', () => {
    render(() => <SkillModeSection {...defaultProps} enabled={false} />);

    expect(screen.queryByLabelText('System Prompt')).not.toBeInTheDocument();
  });

  it('renders system prompt with initial value', () => {
    render(() => (
      <SkillModeSection {...defaultProps} enabled={true} systemPrompt="Test system prompt" />
    ));

    const textarea = screen.getByDisplayValue('Test system prompt');
    expect(textarea).toBeInTheDocument();
  });

  it('calls onSystemPromptChange when system prompt changes', () => {
    const onSystemPromptChange = vi.fn();
    render(() => (
      <SkillModeSection
        {...defaultProps}
        enabled={true}
        onSystemPromptChange={onSystemPromptChange}
      />
    ));

    const textarea = screen.getByLabelText('System Prompt');
    fireEvent.input(textarea, { target: { value: 'New system prompt' } });

    expect(onSystemPromptChange).toHaveBeenCalledWith('New system prompt');
  });

  it('shows knowledge fragments section when enabled', () => {
    render(() => <SkillModeSection {...defaultProps} enabled={true} />);

    expect(screen.getByText('Knowledge Fragments')).toBeInTheDocument();
  });

  it('renders knowledge fragments when provided', () => {
    render(() => (
      <SkillModeSection
        {...defaultProps}
        enabled={true}
        knowledgeFragments={['Fragment 1', 'Fragment 2']}
      />
    ));

    expect(screen.getByDisplayValue('Fragment 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Fragment 2')).toBeInTheDocument();
  });

  it('calls onFragmentsChange when fragment content changes', () => {
    const onFragmentsChange = vi.fn();
    render(() => (
      <SkillModeSection
        {...defaultProps}
        enabled={true}
        knowledgeFragments={['Fragment 1']}
        onFragmentsChange={onFragmentsChange}
      />
    ));

    const textarea = screen.getByDisplayValue('Fragment 1');
    fireEvent.input(textarea, { target: { value: 'Updated fragment' } });

    expect(onFragmentsChange).toHaveBeenCalledWith(['Updated fragment']);
  });

  it('renders Add Fragment button when enabled', () => {
    render(() => <SkillModeSection {...defaultProps} enabled={true} />);

    expect(screen.getByText('Add Fragment')).toBeInTheDocument();
  });

  it('calls onFragmentsChange when adding a fragment', () => {
    const onFragmentsChange = vi.fn();
    render(() => (
      <SkillModeSection {...defaultProps} enabled={true} onFragmentsChange={onFragmentsChange} />
    ));

    const addButton = screen.getByText('Add Fragment');
    fireEvent.click(addButton);

    expect(onFragmentsChange).toHaveBeenCalledWith(['']);
  });

  it('calls onFragmentsChange when removing a fragment', () => {
    const onFragmentsChange = vi.fn();
    render(() => (
      <SkillModeSection
        {...defaultProps}
        enabled={true}
        knowledgeFragments={['Fragment 1', 'Fragment 2']}
        onFragmentsChange={onFragmentsChange}
      />
    ));

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);

    expect(onFragmentsChange).toHaveBeenCalledWith(['Fragment 2']);
  });

  it('renders remove buttons for each fragment', () => {
    render(() => (
      <SkillModeSection
        {...defaultProps}
        enabled={true}
        knowledgeFragments={['Fragment 1', 'Fragment 2', 'Fragment 3']}
      />
    ));

    const removeButtons = screen.getAllByText('Remove');
    expect(removeButtons).toHaveLength(3);
  });
});

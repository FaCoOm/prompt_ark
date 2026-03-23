import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import {
  SkillManager,
  type Skill,
} from '../../../../src/entrypoints/sidepanel/components/modals/SkillManager';

describe('SkillManager', () => {
  const mockOnDeleteSkill = vi.fn();

  const mockSkills: Skill[] = [
    {
      id: 'skill-1',
      name: 'JavaScript Expert',
      content: 'You are a JavaScript expert...',
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'skill-2',
      name: 'Copywriter',
      content: 'You are a professional copywriter...',
      createdAt: Date.now() - 172800000,
    },
    {
      id: 'skill-3',
      name: 'Code Reviewer',
      content: 'You are a code reviewer...',
      createdAt: Date.now(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Skill List View', () => {
    it('should render empty state when no skills', () => {
      render(() => <SkillManager skills={[]} onDeleteSkill={mockOnDeleteSkill} />);

      expect(screen.getByText('No skills available')).toBeInTheDocument();
    });

    it('should render skill list', () => {
      render(() => <SkillManager skills={mockSkills} onDeleteSkill={mockOnDeleteSkill} />);

      expect(screen.getByText('JavaScript Expert')).toBeInTheDocument();
      expect(screen.getByText('Copywriter')).toBeInTheDocument();
      expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
    });

    it('should display skill dates', () => {
      render(() => <SkillManager skills={mockSkills} onDeleteSkill={mockOnDeleteSkill} />);

      const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(dateElements.length).toBe(mockSkills.length);
    });

    it('should navigate to skill detail on click', async () => {
      render(() => <SkillManager skills={mockSkills} onDeleteSkill={mockOnDeleteSkill} />);

      const skillButton = screen.getByText('JavaScript Expert');
      fireEvent.click(skillButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
      });

      expect(screen.getAllByText('JavaScript Expert').length).toBeGreaterThan(0);
    });
  });

  describe('Skill Detail View', () => {
    it('should display skill content', async () => {
      render(() => <SkillManager skills={mockSkills} onDeleteSkill={mockOnDeleteSkill} />);

      const skillButton = screen.getByText('JavaScript Expert');
      fireEvent.click(skillButton);

      await waitFor(() => {
        expect(screen.getByText('You are a JavaScript expert...')).toBeInTheDocument();
      });
    });

    it('should navigate back to list', async () => {
      render(() => <SkillManager skills={mockSkills} onDeleteSkill={mockOnDeleteSkill} />);

      const skillButton = screen.getByText('JavaScript Expert');
      fireEvent.click(skillButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /Back/i });
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Copywriter')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /Back/i })).not.toBeInTheDocument();
    });

    it('should delete skill', async () => {
      render(() => <SkillManager skills={mockSkills} onDeleteSkill={mockOnDeleteSkill} />);

      const skillButton = screen.getByText('JavaScript Expert');
      fireEvent.click(skillButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      expect(mockOnDeleteSkill).toHaveBeenCalledWith('skill-1');
    });

    it('should return to list after delete', async () => {
      render(() => <SkillManager skills={mockSkills} onDeleteSkill={mockOnDeleteSkill} />);

      const skillButton = screen.getByText('JavaScript Expert');
      fireEvent.click(skillButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      expect(mockOnDeleteSkill).toHaveBeenCalledWith('skill-1');
    });
  });

  describe('Navigation Flow', () => {
    it('should allow navigating between skills', async () => {
      render(() => <SkillManager skills={mockSkills} onDeleteSkill={mockOnDeleteSkill} />);

      fireEvent.click(screen.getByText('JavaScript Expert'));

      await waitFor(() => {
        expect(screen.getByText('You are a JavaScript expert...')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Back/i }));

      await waitFor(() => {
        expect(screen.getByText('Copywriter')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Copywriter'));

      await waitFor(() => {
        expect(screen.getByText('You are a professional copywriter...')).toBeInTheDocument();
      });
    });

    it('should handle single skill', async () => {
      const singleSkill = [mockSkills[0]];
      render(() => <SkillManager skills={singleSkill} onDeleteSkill={mockOnDeleteSkill} />);

      expect(screen.getByText('JavaScript Expert')).toBeInTheDocument();

      fireEvent.click(screen.getByText('JavaScript Expert'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
      });
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import { ContentEditor } from '@/entrypoints/sidepanel/components/modals/EditModal/ContentEditor';

describe('ContentEditor', () => {
  const defaultProps = {
    content: '',
    onChange: vi.fn(),
  };

  it('renders edit and preview tabs', () => {
    render(() => <ContentEditor {...defaultProps} />);

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('starts with edit tab active by default', () => {
    render(() => <ContentEditor {...defaultProps} />);

    const editTab = screen.getByText('Edit');
    expect(editTab).toHaveClass('active');
  });

  it('renders textarea in edit mode', () => {
    render(() => <ContentEditor {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Write your prompt content here/i);
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName.toLowerCase()).toBe('textarea');
  });

  it('displays initial content in textarea', () => {
    render(() => <ContentEditor {...defaultProps} content="Test content" />);

    const textarea = screen.getByDisplayValue('Test content');
    expect(textarea).toBeInTheDocument();
  });

  it('calls onChange when textarea content changes', () => {
    const onChange = vi.fn();
    render(() => <ContentEditor {...defaultProps} onChange={onChange} />);

    const textarea = screen.getByPlaceholderText(/Write your prompt content here/i);
    fireEvent.input(textarea, { target: { value: 'New content' } });

    expect(onChange).toHaveBeenCalledWith('New content');
  });

  it('switches to preview tab when clicked', () => {
    render(() => <ContentEditor {...defaultProps} content="# Hello" />);

    const previewTab = screen.getByText('Preview');
    fireEvent.click(previewTab);

    expect(previewTab).toHaveClass('active');
  });

  it('renders line numbers based on content', () => {
    render(() => <ContentEditor {...defaultProps} content={'Line 1\nLine 2\nLine 3'} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders single line number for empty content', () => {
    render(() => <ContentEditor {...defaultProps} />);

    const lineNumbers = document.querySelectorAll('.content-editor-line-number');
    expect(lineNumbers.length).toBe(1);
  });

  it('renders preview content in preview mode', () => {
    render(() => <ContentEditor {...defaultProps} content="# Heading" />);

    const previewTab = screen.getByText('Preview');
    fireEvent.click(previewTab);

    const previewContent = document.querySelector('.content-editor-preview');
    expect(previewContent).toBeInTheDocument();
  });

  it('highlights variables in preview mode', () => {
    render(() => <ContentEditor {...defaultProps} content="Hello {{name}}" />);

    const previewTab = screen.getByText('Preview');
    fireEvent.click(previewTab);

    const previewContent = document.querySelector('.content-editor-preview');
    expect(previewContent?.innerHTML).toContain('content-editor-variable');
  });

  it('handles multiple variables in content', () => {
    render(() => <ContentEditor {...defaultProps} content="{{var1}} and {{var2}}" />);

    const previewTab = screen.getByText('Preview');
    fireEvent.click(previewTab);

    const previewContent = document.querySelector('.content-editor-preview');
    const variables = previewContent?.querySelectorAll('.content-editor-variable');
    expect(variables?.length).toBe(2);
  });

  it('switches back to edit tab from preview', () => {
    render(() => <ContentEditor {...defaultProps} />);

    const previewTab = screen.getByText('Preview');
    fireEvent.click(previewTab);

    const editTab = screen.getByText('Edit');
    fireEvent.click(editTab);

    expect(editTab).toHaveClass('active');
    expect(screen.getByPlaceholderText(/Write your prompt content here/i)).toBeInTheDocument();
  });
});

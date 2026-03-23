import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import { BasicForm } from '../../../../../src/entrypoints/sidepanel/components/modals/EditModal/BasicForm';

describe('BasicForm', () => {
  const defaultProps = {
    title: '',
    category: '',
    shortcut: '',
    onTitleChange: vi.fn(),
    onCategoryChange: vi.fn(),
    onShortcutChange: vi.fn(),
    errors: {},
    existingCategories: ['Work', 'Personal', 'Coding'],
  };

  it('renders all form fields', () => {
    render(() => <BasicForm {...defaultProps} />);

    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Shortcut')).toBeInTheDocument();
  });

  it('renders with initial values', () => {
    render(() => (
      <BasicForm {...defaultProps} title="Test Title" category="Test Category" shortcut="/test" />
    ));

    expect(screen.getByLabelText('Title')).toHaveValue('Test Title');
    expect(screen.getByLabelText('Category')).toHaveValue('Test Category');
    expect(screen.getByLabelText('Shortcut')).toHaveValue('/test');
  });

  it('calls onTitleChange when title input changes', () => {
    const onTitleChange = vi.fn();
    render(() => <BasicForm {...defaultProps} onTitleChange={onTitleChange} />);

    const titleInput = screen.getByLabelText('Title');
    fireEvent.input(titleInput, { target: { value: 'New Title' } });

    expect(onTitleChange).toHaveBeenCalledWith('New Title');
  });

  it('calls onCategoryChange when category input changes', () => {
    const onCategoryChange = vi.fn();
    render(() => <BasicForm {...defaultProps} onCategoryChange={onCategoryChange} />);

    const categoryInput = screen.getByLabelText('Category');
    fireEvent.input(categoryInput, { target: { value: 'New Category' } });

    expect(onCategoryChange).toHaveBeenCalledWith('New Category');
  });

  it('calls onShortcutChange when shortcut input changes', () => {
    const onShortcutChange = vi.fn();
    render(() => <BasicForm {...defaultProps} onShortcutChange={onShortcutChange} />);

    const shortcutInput = screen.getByLabelText('Shortcut');
    fireEvent.input(shortcutInput, { target: { value: '/new' } });

    expect(onShortcutChange).toHaveBeenCalledWith('/new');
  });

  it('displays validation error for title', () => {
    render(() => <BasicForm {...defaultProps} errors={{ title: 'Title is required' }} />);

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveClass('error');
  });

  it('renders existing categories in datalist', () => {
    render(() => <BasicForm {...defaultProps} />);

    const datalist = document.getElementById('basic-form-category-list');
    expect(datalist).toBeInTheDocument();
    expect(datalist?.querySelectorAll('option')).toHaveLength(3);
  });

  it('renders empty datalist when no existing categories', () => {
    render(() => <BasicForm {...defaultProps} existingCategories={[]} />);

    const datalist = document.getElementById('basic-form-category-list');
    expect(datalist).toBeInTheDocument();
    expect(datalist?.querySelectorAll('option')).toHaveLength(0);
  });

  it('has correct placeholder text', () => {
    render(() => <BasicForm {...defaultProps} />);

    expect(screen.getByPlaceholderText('Enter prompt title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter or select category')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., /email')).toBeInTheDocument();
  });
});

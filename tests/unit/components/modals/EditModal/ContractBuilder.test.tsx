import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import { ContractBuilder } from '@/entrypoints/sidepanel/components/modals/EditModal/ContractBuilder';

describe('ContractBuilder', () => {
  const defaultProps = {
    outputFormat: 'markdown',
    lengthLimit: 1000,
    tone: 'professional',
    excludedContent: '',
    onOutputFormatChange: vi.fn(),
    onLengthLimitChange: vi.fn(),
    onToneChange: vi.fn(),
    onExcludedContentChange: vi.fn(),
  };

  it('renders output format selector', () => {
    render(() => <ContractBuilder {...defaultProps} />);

    expect(screen.getByLabelText('Output Format')).toBeInTheDocument();
  });

  it('renders all output format options', () => {
    render(() => <ContractBuilder {...defaultProps} />);

    const select = screen.getByLabelText('Output Format') as HTMLSelectElement;
    expect(select.options.length).toBe(6);
    expect(select.options[0].text).toBe('Markdown');
    expect(select.options[1].text).toBe('JSON');
    expect(select.options[2].text).toBe('Table');
    expect(select.options[3].text).toBe('Code');
    expect(select.options[4].text).toBe('Plain Text');
    expect(select.options[5].text).toBe('HTML');
  });

  it('selects correct output format', () => {
    render(() => <ContractBuilder {...defaultProps} outputFormat="json" />);

    const select = screen.getByLabelText('Output Format') as HTMLSelectElement;
    expect(select.value).toBe('json');
  });

  it('calls onOutputFormatChange when format changes', () => {
    const onOutputFormatChange = vi.fn();
    render(() => <ContractBuilder {...defaultProps} onOutputFormatChange={onOutputFormatChange} />);

    const select = screen.getByLabelText('Output Format');
    fireEvent.change(select, { target: { value: 'code' } });

    expect(onOutputFormatChange).toHaveBeenCalledWith('code');
  });

  it('renders length limit slider', () => {
    render(() => <ContractBuilder {...defaultProps} />);

    expect(screen.getByLabelText(/Length Limit/i)).toBeInTheDocument();
  });

  it('displays current length limit value', () => {
    render(() => <ContractBuilder {...defaultProps} lengthLimit={2000} />);

    expect(screen.getByText('2000')).toBeInTheDocument();
  });

  it('calls onLengthLimitChange when slider changes', () => {
    const onLengthLimitChange = vi.fn();
    render(() => <ContractBuilder {...defaultProps} onLengthLimitChange={onLengthLimitChange} />);

    const slider = screen.getByLabelText(/Length Limit/i);
    fireEvent.input(slider, { target: { value: '1500' } });

    expect(onLengthLimitChange).toHaveBeenCalledWith(1500);
  });

  it('has correct slider range attributes', () => {
    render(() => <ContractBuilder {...defaultProps} />);

    const slider = screen.getByLabelText(/Length Limit/i) as HTMLInputElement;
    expect(slider.min).toBe('100');
    expect(slider.max).toBe('4000');
    expect(slider.step).toBe('100');
  });

  it('renders tone selector', () => {
    render(() => <ContractBuilder {...defaultProps} />);

    expect(screen.getByLabelText('Tone')).toBeInTheDocument();
  });

  it('renders all tone options', () => {
    render(() => <ContractBuilder {...defaultProps} />);

    const select = screen.getByLabelText('Tone') as HTMLSelectElement;
    expect(select.options.length).toBe(5);
    expect(select.options[0].text).toBe('Formal');
    expect(select.options[1].text).toBe('Casual');
    expect(select.options[2].text).toBe('Professional');
    expect(select.options[3].text).toBe('Friendly');
    expect(select.options[4].text).toBe('Technical');
  });

  it('selects correct tone', () => {
    render(() => <ContractBuilder {...defaultProps} tone="casual" />);

    const select = screen.getByLabelText('Tone') as HTMLSelectElement;
    expect(select.value).toBe('casual');
  });

  it('calls onToneChange when tone changes', () => {
    const onToneChange = vi.fn();
    render(() => <ContractBuilder {...defaultProps} onToneChange={onToneChange} />);

    const select = screen.getByLabelText('Tone');
    fireEvent.change(select, { target: { value: 'technical' } });

    expect(onToneChange).toHaveBeenCalledWith('technical');
  });

  it('renders excluded content textarea', () => {
    render(() => <ContractBuilder {...defaultProps} />);

    expect(screen.getByLabelText('Excluded Content')).toBeInTheDocument();
  });

  it('displays excluded content value', () => {
    render(() => <ContractBuilder {...defaultProps} excludedContent="Exclude this" />);

    expect(screen.getByDisplayValue('Exclude this')).toBeInTheDocument();
  });

  it('calls onExcludedContentChange when excluded content changes', () => {
    const onExcludedContentChange = vi.fn();
    render(() => (
      <ContractBuilder {...defaultProps} onExcludedContentChange={onExcludedContentChange} />
    ));

    const textarea = screen.getByLabelText('Excluded Content');
    fireEvent.input(textarea, { target: { value: 'New exclusion' } });

    expect(onExcludedContentChange).toHaveBeenCalledWith('New exclusion');
  });

  it('has correct placeholder for excluded content', () => {
    render(() => <ContractBuilder {...defaultProps} />);

    expect(
      screen.getByPlaceholderText(/topics, phrases, or content to avoid/i)
    ).toBeInTheDocument();
  });

  it('displays help text for excluded content', () => {
    render(() => <ContractBuilder {...defaultProps} />);

    expect(screen.getByText(/List anything that should not appear/i)).toBeInTheDocument();
  });

  it('renders length range hints', () => {
    render(() => <ContractBuilder {...defaultProps} />);

    const hints = document.querySelector('.length-range-hints');
    expect(hints).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('4000')).toBeInTheDocument();
  });
});

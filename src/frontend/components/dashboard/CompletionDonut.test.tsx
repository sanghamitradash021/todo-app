import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompletionDonut } from './CompletionDonut';

describe('CompletionDonut', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <CompletionDonut completionPct={50} completed={5} pending={5} total={10} />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('displays the completion percentage label', () => {
    render(<CompletionDonut completionPct={67} completed={2} pending={1} total={3} />);
    expect(screen.getByText('67%')).toBeTruthy();
  });

  it('displays "0%" when total is 0', () => {
    render(<CompletionDonut completionPct={0} completed={0} pending={0} total={0} />);
    expect(screen.getByText('0%')).toBeTruthy();
  });

  it('displays "100%" when all todos are completed', () => {
    render(<CompletionDonut completionPct={100} completed={5} pending={0} total={5} />);
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('renders the section heading', () => {
    render(<CompletionDonut completionPct={0} completed={0} pending={0} total={0} />);
    expect(screen.getByText('Completion Rate')).toBeTruthy();
  });

  it('has an accessible aria-label on the center label', () => {
    render(<CompletionDonut completionPct={42} completed={2} pending={3} total={5} />);
    expect(screen.getByLabelText('42 percent completion')).toBeTruthy();
  });
});

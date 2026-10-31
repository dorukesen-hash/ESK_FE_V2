import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Add to cart</Button>);
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Click me' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when the disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });

  it('uses the theme accent color for the primary variant, not a generic gray', () => {
    render(<Button variant="primary">Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.className).toContain('bg-accent');
    expect(button.className).toContain('text-accent-foreground');
    expect(button.className).not.toContain('slate');
  });

  it('uses theme tokens for the secondary variant, not a generic gray', () => {
    render(<Button variant="secondary">Cancel</Button>);
    const button = screen.getByRole('button', { name: 'Cancel' });
    expect(button.className).not.toContain('slate');
  });

  it('uses theme border/tint tokens for the outline variant, not a generic gray', () => {
    render(<Button variant="outline">Add</Button>);
    const button = screen.getByRole('button', { name: 'Add' });
    expect(button.className).toContain('border-border');
    expect(button.className).not.toContain('slate');
  });
});

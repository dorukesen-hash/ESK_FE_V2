import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteView } from './QuoteView';

describe('QuoteView', () => {
  it('shows validation errors for empty required fields', async () => {
    render(<QuoteView />);
    await userEvent.click(screen.getByRole('button', { name: 'Send Quote Request' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Company is required')).toBeInTheDocument();
    expect(screen.getByText('Message is required')).toBeInTheDocument();
  });

  it('renders real, clickable contact details', () => {
    render(<QuoteView />);
    expect(screen.getByRole('link', { name: /469-992-2447/ })).toHaveAttribute(
      'href',
      'tel:+14699922447'
    );
    expect(
      screen.getByRole('link', { name: /sales@eskpackaging.com/ })
    ).toHaveAttribute('href', 'mailto:sales@eskpackaging.com');
    expect(
      screen.getByText('2050 Forest Ln #350, Garland, TX 75042')
    ).toBeInTheDocument();
  });

  it('opens a pre-filled mailto link on successful submit', async () => {
    render(<QuoteView />);

    await userEvent.type(screen.getByLabelText('Name'), 'Jane Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Company'), 'Acme Co');
    await userEvent.type(
      screen.getByLabelText('What do you need quoted?'),
      '500 rolls of stretch film'
    );

    const assign = vi.fn();
    delete window.location;
    window.location = { assign };

    await userEvent.click(screen.getByRole('button', { name: 'Send Quote Request' }));

    expect(assign).toHaveBeenCalledTimes(1);
    const url = assign.mock.calls[0][0];
    expect(url).toMatch(/^mailto:sales@eskpackaging\.com\?subject=/);
    expect(url).toContain(encodeURIComponent('Acme Co'));
  });
});

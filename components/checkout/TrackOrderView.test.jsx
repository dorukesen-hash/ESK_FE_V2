import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOrderLookup } from '@/hooks/useOrderLookup';
import { TrackOrderView } from './TrackOrderView';

vi.mock('@/hooks/useOrderLookup', () => ({ useOrderLookup: vi.fn() }));

describe('TrackOrderView', () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    mutateAsync.mockReset();
    useOrderLookup.mockReturnValue({ mutateAsync, isPending: false });
  });

  it('requires an email before submitting', async () => {
    render(<TrackOrderView />);
    await userEvent.click(screen.getByRole('button', { name: 'Find my order(s)' }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('submits email alone', async () => {
    mutateAsync.mockResolvedValue([]);
    render(<TrackOrderView />);
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Find my order(s)' }));
    expect(mutateAsync).toHaveBeenCalledWith({ email: 'jane@example.com', orderNumber: '' });
  });

  it('shows a not-found message for zero results', async () => {
    mutateAsync.mockResolvedValue([]);
    render(<TrackOrderView />);
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Find my order(s)' }));
    expect(
      await screen.findByText("We couldn't find any orders for that email.")
    ).toBeInTheDocument();
  });

  it('renders a single result as full order detail directly', async () => {
    mutateAsync.mockResolvedValue([
      { id: 1, orderNumber: 'ESK-1001', createdAt: '2026-01-15T00:00:00.000Z', price: '68.00', orderstatus: { name: 'Completed' }, orderitems: [] },
    ]);
    render(<TrackOrderView />);
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Find my order(s)' }));
    expect(await screen.findByRole('heading', { name: 'Order #ESK-1001' })).toBeInTheDocument();
    // A guest looking up an order has no account - the detail view must not
    // borrow the authenticated account page's "My Account" kicker.
    expect(screen.queryByText('My Account')).not.toBeInTheDocument();
  });

  it('renders multiple results as a list, then shows detail on click', async () => {
    mutateAsync.mockResolvedValue([
      { id: 1, orderNumber: 'ESK-1001', createdAt: '2026-01-15T00:00:00.000Z', price: '68.00', orderstatus: { name: 'Completed' }, orderitems: [] },
      { id: 2, orderNumber: 'ESK-1002', createdAt: '2026-01-20T00:00:00.000Z', price: '140.00', orderstatus: { name: 'Pending' }, orderitems: [] },
    ]);
    render(<TrackOrderView />);
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Find my order(s)' }));

    expect(await screen.findByText('#ESK-1001')).toBeInTheDocument();
    expect(screen.getByText('#ESK-1002')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Order #/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'View' })[0]);
    expect(await screen.findByRole('heading', { name: 'Order #ESK-1001' })).toBeInTheDocument();
  });

  it('shows the rate limiter\'s own message when the lookup is throttled', async () => {
    mutateAsync.mockRejectedValue({
      response: { data: { message: 'Too many lookup attempts. Please try again later.' } },
    });
    render(<TrackOrderView />);
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Find my order(s)' }));

    expect(
      await screen.findByText('Too many lookup attempts. Please try again later.')
    ).toBeInTheDocument();
  });

  it('shows a generic error message when the lookup fails with no server message', async () => {
    mutateAsync.mockRejectedValue(new Error('network down'));
    render(<TrackOrderView />);
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Find my order(s)' }));

    expect(
      await screen.findByText("We couldn't look that up right now. Please try again.")
    ).toBeInTheDocument();
  });
});

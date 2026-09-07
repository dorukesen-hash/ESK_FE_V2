import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAccountInvoices } from '@/hooks/useAccountInvoices';
import { InvoicesView } from './InvoicesView';

vi.mock('@/hooks/useAccountInvoices', () => ({
  useAccountInvoices: vi.fn(),
}));

describe('InvoicesView', () => {
  it('shows a loading state', () => {
    useAccountInvoices.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<InvoicesView />);
    expect(screen.getByText('Loading invoices…')).toBeInTheDocument();
  });

  it('shows an error state', () => {
    useAccountInvoices.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<InvoicesView />);
    expect(screen.getByRole('alert')).toHaveTextContent("couldn't load your invoices");
  });

  it('shows an empty state', () => {
    useAccountInvoices.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<InvoicesView />);
    expect(screen.getByText('No invoices yet.')).toBeInTheDocument();
  });

  it('lists invoices with document number, date, and total', () => {
    useAccountInvoices.mockReturnValue({
      data: [
        {
          id: 1,
          documentNumber: 'INV-1001',
          issueDate: '2026-01-15',
          grandTotalInclVat: '150.00',
          orders: [{ id: 42, orderNumber: 'ESK-1001' }],
        },
      ],
      isLoading: false,
      isError: false,
    });
    render(<InvoicesView />);

    expect(screen.getByText('INV-1001')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });
});

'use client';

import { FileText, Download } from 'lucide-react';
import { useAccountInvoices } from '@/hooks/useAccountInvoices';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// The invoice<->order relation is a hasMany on the backend (see
// ESK_API db/models/index.js: Invoice.hasMany(Order)), so it can come
// back as an array under either the pluralized default Sequelize alias
// or a singular shape - check both rather than assume one.
function relatedOrder(invoice) {
  return invoice.orders?.[0] ?? invoice.order ?? null;
}

export function InvoicesView() {
  const { data: invoices, isLoading, isError } = useAccountInvoices();

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">My Account</p>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
        Invoices
      </h1>

      {isLoading && <p className="mt-6 text-sm text-text-muted">Loading invoices…</p>}

      {isError && (
        <p className="mt-6 text-sm text-red-600" role="alert">
          We couldn&apos;t load your invoices. Please try again later.
        </p>
      )}

      {invoices && invoices.length === 0 && (
        <div className="mt-10 flex flex-col items-center rounded-lg border border-dashed border-border py-16 text-center">
          <FileText aria-hidden="true" className="h-8 w-8 text-accent" />
          <p className="mt-3 text-sm text-text-muted">No invoices yet.</p>
        </div>
      )}

      {invoices && invoices.length > 0 && (
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted">
              <th className="py-2 font-medium">Invoice</th>
              <th className="py-2 font-medium">Issued</th>
              <th className="py-2 font-medium">Total</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
              const order = relatedOrder(invoice);
              return (
                <tr key={invoice.id} className="border-b border-border">
                  <td className="py-3 font-medium text-text-primary">
                    {invoice.documentNumber ?? invoice.code ?? '—'}
                  </td>
                  <td className="py-3 text-text-muted">{formatDate(invoice.issueDate)}</td>
                  <td className="py-3 text-text-muted">
                    {invoice.grandTotalInclVat != null
                      ? `$${Number(invoice.grandTotalInclVat).toFixed(2)}`
                      : '—'}
                  </td>
                  <td className="py-3 text-right">
                    {API_URL && order?.id ? (
                      <a
                        href={`${API_URL}/invoices/pdf/${order.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-1.5 font-semibold text-primary transition-colors hover:text-primary-hover"
                      >
                        <Download
                          aria-hidden="true"
                          className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5"
                        />
                        Download
                      </a>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

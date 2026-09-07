'use client';

import { useState } from 'react';

function AccordionItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-text-primary"
      >
        {question}
        <span aria-hidden="true" className="text-text-muted">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && <p className="pb-4 text-sm text-text-muted">{answer}</p>}
    </div>
  );
}

export function Accordion({ items }) {
  if (items.length === 0) {
    return <p className="py-4 text-sm text-text-muted">No matching questions.</p>;
  }

  return (
    <div>
      {items.map((item) => (
        <AccordionItem key={item.q} question={item.q} answer={item.a} />
      ))}
    </div>
  );
}

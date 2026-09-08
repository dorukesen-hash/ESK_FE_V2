'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

function AccordionItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-text-primary transition-colors hover:text-primary"
      >
        {question}
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-accent transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed text-text-muted">{answer}</p>
      )}
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

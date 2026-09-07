'use client';

import { useState } from 'react';

// A plain controlled <input type="number"> that forces an invalid/empty
// value back to a fallback on every keystroke (e.g. `Number(v) || 1`) snaps
// to that fallback the instant the field is cleared - then typing the next
// digit appends to it instead of replacing it (clearing then typing "5"
// becomes "15", not "5"). Local text state lets the field sit empty/partial
// while the user types, only committing to the caller once the text parses
// to a valid positive integer; onBlur restores the last committed value if
// the field is left empty or invalid.
export function QuantityInput({ id, value, onChange, className }) {
  const [text, setText] = useState(String(value));
  // Resync local text with an externally-changed `value` during render
  // (React's documented alternative to a useEffect for deriving state from
  // props), rather than after an extra render/effect pass.
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    setText(String(value));
  }

  function handleChange(event) {
    const raw = event.target.value;
    setText(raw);
    const parsed = Number(raw);
    if (raw !== '' && Number.isInteger(parsed) && parsed >= 1) {
      onChange(parsed);
    }
  }

  function handleBlur() {
    const parsed = Number(text);
    if (text === '' || !Number.isInteger(parsed) || parsed < 1) {
      setText(String(value));
    }
  }

  return (
    <input
      id={id}
      type="number"
      min="1"
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
}

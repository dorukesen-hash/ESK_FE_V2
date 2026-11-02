'use client';

import { useElementHeightVar } from '@/hooks/useElementHeightVar';
import { Header } from './Header';
import { Navbar } from './Navbar';

// Every page needs to know exactly how tall this sticky header+navbar
// block really is, to position whatever sticks below it (Breadcrumbs,
// then any helper sidebar/buy-box). A guessed fixed pixel value broke
// the moment this block's own height changed by even a few pixels -
// measuring it once, here, and publishing it as --chrome-height means
// every consumer of that offset tracks the real number automatically.
export function ChromeStack() {
  const ref = useElementHeightVar('--chrome-height');

  return (
    <div ref={ref} className="sticky top-0 z-20">
      <Header />
      <Navbar />
    </div>
  );
}

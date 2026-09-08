import Image from 'next/image';
import Link from 'next/link';

const TRUST_POINTS = [
  'Low Price Guarantee — we meet or beat any total order price.',
  'Most stock orders ship the very same day.',
  '100% Satisfaction Guarantee on every order.',
];

export function AuthShell({ image, alt, kicker, heading, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <Image
          src={image}
          alt={alt}
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-60"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/20"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -left-6 select-none text-[260px] font-black leading-none text-on-ink/[0.06]"
        >
          e
        </span>

        <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
          <Link href="/" className="inline-block">
            <Image
              src="/esk-icon-dark.png"
              alt="ESK Packaging"
              width={168}
              height={24}
              className="h-7 w-auto"
            />
          </Link>

          <div className="max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
              {kicker}
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-white xl:text-5xl">
              {heading}
            </h1>
            <p className="mt-4 text-sm text-on-ink-muted">{subtitle}</p>
          </div>

          <ul className="space-y-3">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex gap-3 text-sm text-on-ink-muted">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16 sm:px-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-10 inline-block lg:hidden">
            <Image
              src="/esk-icon.png"
              alt="ESK Packaging"
              width={168}
              height={24}
              className="h-6 w-auto"
            />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}

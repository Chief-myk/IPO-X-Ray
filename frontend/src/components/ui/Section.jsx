import React from 'react';

/* Shared page section: one width, one rhythm, one eyebrow style for every block. */
export default function Section({ id, eyebrow, className = '', children, ...rest }) {
  return (
    <section
      id={id}
      className={`relative overflow-hidden scroll-mt-24 border-t border-line py-16 lg:py-24 ${className}`}
      {...rest}
    >
      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {children}
      </div>
    </section>
  );
}

export function Eyebrow({ children }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="h-px w-8 bg-beam" aria-hidden="true" />
      <span className="text-sm font-medium text-beam">{children}</span>
    </div>
  );
}

export function SectionTitle({ id, children }) {
  return (
    <h2
      id={id}
      className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] font-serif text-bone"
    >
      {children}
    </h2>
  );
}

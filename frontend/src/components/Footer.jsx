import React from 'react';

export default function Footer() {
  return (
    <footer className="flex flex-col sm:flex-row justify-between gap-3 px-4 md:px-12 py-7 border-t border-line text-xs text-[#6E8497] max-w-[1560px] mx-auto">
      <p>
        IPO X-Ray screens public information automatically. It is not investment advice and a flag is not proof of wrongdoing.
      </p>
      <p className="sm:text-right whitespace-nowrap">
        Built for HackIIITD 2026 on TinyFish web agents.
      </p>
    </footer>
  );
}

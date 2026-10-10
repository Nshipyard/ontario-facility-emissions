"use client";

import { useLang } from "@/i18n";

export default function Methodology() {
  const { t } = useLang();
  const m = t.methodology;
  return (
    <section id="methodology" className="bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{m.kicker}</p>
        <h2 className="display mt-4 max-w-[760px] text-[40px] md:text-[52px]">{m.title}</h2>
        <ol className="mt-10 max-w-[820px] space-y-5">
          {m.items.map((item, i) => (
            <li key={i} className="flex gap-5 rounded-[24px] border border-line bg-paper p-6">
              <span className="display shrink-0 text-[28px] text-canada">{i + 1}</span>
              <p className="text-[15px] leading-relaxed text-ink/75">{item}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

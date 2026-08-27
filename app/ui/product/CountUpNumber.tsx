import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "./useReveal";

/**
 * Counts a number up from 0 once scrolled into view — shared by every
 * `app/ui/product` case study that ports a reference page's own
 * `data-target`/`IntersectionObserver` count-up timer (`SamVaultCaseStudy`'s
 * stat row, `ForgePipelineCaseStudy`'s stats bar) — ported to GSAP.
 */
export default function CountUpNumber({
  target,
  suffix,
  className,
}: {
  target: number;
  suffix: string;
  className: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    if (prefersReducedMotion()) {
      el.textContent = `${target}${suffix}`;
      return;
    }

    const counter = { value: 0 };

    const ctx = gsap.context(() => {
      gsap.to(counter, {
        value: target,
        duration: 1.6,
        ease: "power1.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
        onUpdate: () => {
          el.textContent = `${Math.floor(counter.value)}${suffix}`;
        },
      });
    });

    return () => ctx.revert();
  }, [target, suffix]);

  return (
    <div ref={ref} className={className}>
      0{suffix}
    </div>
  );
}

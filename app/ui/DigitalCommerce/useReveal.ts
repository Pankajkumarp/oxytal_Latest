import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

/**
 * Shared scroll-reveal hooks for every `DigitalCommerce*` section
 * component — this component set's own equivalent of the reference's
 * `.reveal`/`.reveal.in` (a CSS-transition class toggled by a vanilla
 * `IntersectionObserver`; see `DigitalCommerce.module.css`'s doc
 * comment for why it isn't ported). The same scroll-in fade/rise is
 * done with GSAP + ScrollTrigger instead, this codebase's usual
 * animation approach:
 *
 * - `useSplitReveal` is the same word-split heading treatment every
 *   other section in this app uses (AboutApproach/HomeServices/...)
 * - `useFadeUp`/`useStaggerReveal` are this component's plainer stand-
 *   ins for the reference's own whole-block/per-card reveals
 *
 * All three skip straight to the settled state under
 * `prefers-reduced-motion`. `ScrollTrigger`/`SplitText` are registered
 * once, in `DigitalCommerce.tsx` (the entry point every section is
 * rendered under), so this file only imports what it calls directly.
 */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useSplitReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(ref.current, { opacity: 1 });
      return;
    }

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      split = SplitText.create(ref.current!, {
        type: "words",
        mask: "words",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.words, {
            yPercent: 115,
            rotate: 3,
            opacity: 0,
            duration: 1,
            ease: "power4.out",
            stagger: 0.06,
            scrollTrigger: {
              trigger: ref.current,
              start: "top 85%",
              once: true,
            },
          }),
      });
    });

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, []);

  return ref;
}

export function useFadeUp<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(ref.current, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        opacity: 0,
        y: 18,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 88%",
          once: true,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return ref;
}

export function useStaggerReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(ref.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(ref.current!.children, {
        opacity: 0,
        y: 18,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: ref.current,
          start: "top 88%",
          once: true,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return ref;
}

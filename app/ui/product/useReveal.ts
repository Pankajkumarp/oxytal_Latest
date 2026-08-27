import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

/**
 * Shared scroll-reveal hooks for every component in `app/ui/product`
 * (`SamVaultCaseStudy`, `ActionPulseCaseStudy`, …) — this folder's own
 * copy of the `DigitalCommerce/useReveal.ts` vocabulary, split out once
 * a second case-study page needed the same word-split heading treatment
 * and whole-block/list scroll reveals rather than re-declaring them
 * per file. `ScrollTrigger`/`SplitText` are registered once, in each
 * page component's own module scope (mirroring how every other section
 * in this app registers them), so this file only imports what it calls
 * directly.
 */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Word-by-word GSAP `SplitText` reveal for a section `<h2>`/`<h3>`, triggered once it scrolls into view. */
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
            stagger: 0.05,
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

/** Whole-block fade + rise on scroll — the stand-in for a reference page's generic `.reveal` class (applied to a whole grid/diagram/table at once, not per child). */
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
        y: 30,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          once: true,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return ref;
}

/** Per-item stagger for a list/grid's direct children — the GSAP equivalent of a reference page's own per-item `IntersectionObserver` reveal. */
export function useListStagger<T extends HTMLElement>(axis: "x" | "y", distance: number) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(ref.current.children, { opacity: 1, x: 0, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(ref.current!.children, {
        opacity: 0,
        [axis]: axis === "x" ? -distance : distance,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: ref.current,
          start: "top 88%",
          once: true,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [axis, distance]);

  return ref;
}

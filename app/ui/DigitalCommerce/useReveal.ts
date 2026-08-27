import { useEffect, useLayoutEffect, useRef } from "react";
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
 * - `useDrawPath` ports the reference's `#lifeline` `stroke-dashoffset`
 *   draw-in (see that file's own `<script>` tag) to GSAP, for the
 *   strategy-lifecycle SVG in `CapabilitySection`
 * - `useCardHover` replaces the reference's CSS `:hover` lift/shadow on
 *   `.prob`/`.plat`/`.pc`/`.wc`/`.mode`/`.rc` with a GSAP tween, for a
 *   springier motion than a CSS `transition` gives
 *
 * The first four skip straight to the settled state under
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

/**
 * Draws an SVG `<path>` in on scroll, left to right — the GSAP equivalent
 * of the reference's `#lifeline` `stroke-dashoffset` animation. Needs the
 * path's rendered length up front (`getTotalLength()`), which only exists
 * once the DOM node is mounted, hence the ref + `useLayoutEffect` shape
 * shared with every other hook here rather than something CSS alone
 * could do.
 */
export function useDrawPath<T extends SVGPathElement>() {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    const length = ref.current.getTotalLength();

    if (prefersReducedMotion()) {
      gsap.set(ref.current, { strokeDasharray: length, strokeDashoffset: 0 });
      return;
    }

    gsap.set(ref.current, { strokeDasharray: length, strokeDashoffset: length });

    const ctx = gsap.context(() => {
      gsap.to(ref.current, {
        strokeDashoffset: 0,
        duration: 1.6,
        ease: "power3.inOut",
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

/**
 * Pointer-driven card hover: a GSAP lift + soft shadow on `pointerenter`,
 * eased back out on `pointerleave` — the reference's `.prob:hover`/
 * `.plat:hover`/`.pc:hover`/`.wc:hover`/`.mode:hover`/`.rc:hover` (a CSS
 * `transform`/`box-shadow` `transition`), ported to GSAP for the same
 * springier easing as the rest of this file's motion instead of a linear
 * CSS transition. Any Tailwind `hover:` classes still on the card (a
 * background tint, a border colour) keep working alongside this — they
 * animate different properties, so nothing conflicts.
 *
 * Skips attaching listeners entirely under `prefers-reduced-motion`,
 * same as the scroll-reveal hooks above — the card just never moves.
 */
export function useCardHover<T extends HTMLElement>(options: {
  y?: number;
  shadow?: string;
} = {}) {
  const { y = -6, shadow = "0 20px 40px -20px rgba(26,18,32,.18)" } = options;
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) {
      return;
    }

    const rest = "0 0px 0px 0px rgba(26,18,32,0)";
    gsap.set(el, { boxShadow: rest });

    const onEnter = () =>
      gsap.to(el, { y, boxShadow: shadow, duration: 0.35, ease: "power2.out" });
    const onLeave = () =>
      gsap.to(el, { y: 0, boxShadow: rest, duration: 0.45, ease: "power3.out" });

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [y, shadow]);

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

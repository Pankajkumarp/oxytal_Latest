"use client";

import { useLayoutEffect, useRef, useState, type SubmitEvent } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  ChevronDown,
  FileText,
  Layers,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import { cx } from "@/app/lib/cx";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface RouteCard {
  title: string;
  description: string;
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
  /** Small pill shown above the title — only the careers-portal card has one in the reference. */
  badge?: string;
  arrow: "down" | "right" | "external";
}

/** The 4 routing cards, ported verbatim from `Refrence/oxytal-contact-us.html`'s `.routes` grid. Static/hardcoded by design — see the component doc below. */
const ROUTES: RouteCard[] = [
  {
    title: "A new project",
    description:
      "A build, a migration, a platform that needs rethinking, or a problem you're not sure how to frame yet.",
    href: "#contact-form",
    label: "Use the form below",
    icon: Sparkles,
    arrow: "down",
  },
  {
    title: "A role with us",
    description:
      "Open positions, applications and candidate updates are all handled in our careers portal. Sign in to apply or check where your application stands.",
    href: "https://career.oxyem.io/",
    label: "career.oxyem.io",
    icon: Briefcase,
    external: true,
    badge: "Careers portal",
    arrow: "external",
  },
  {
    title: "Support for a live system",
    description:
      "Already working with us and something needs attention? This reaches the team that runs your platform, not a general inbox.",
    href: "mailto:support@oxytal.com",
    label: "support@oxytal.com",
    icon: ShieldCheck,
    arrow: "right",
  },
  {
    title: "Anything else",
    description:
      "Partnerships, press, invoicing, or a question that doesn't fit the boxes above. A person reads this one.",
    href: "mailto:info@oxytal.com",
    label: "info@oxytal.com",
    icon: Mail,
    arrow: "right",
  },
];

const ARROW_ICONS: Record<RouteCard["arrow"], LucideIcon> = {
  down: ArrowDown,
  right: ArrowRight,
  external: ArrowUpRight,
};

interface ContactRow {
  label: string;
  value: string;
  href: string;
  icon: LucideIcon;
}

/** The aside's "Or reach us directly" rows, ported verbatim from the reference's `.side` panel. Static/hardcoded — see the component doc below. */
const CONTACT_ROWS: ContactRow[] = [
  { label: "New business", value: "info@oxytal.com", href: "mailto:info@oxytal.com", icon: Mail },
  { label: "Existing clients", value: "support@oxytal.com", href: "mailto:support@oxytal.com", icon: ShieldCheck },
  { label: "Careers", value: "career.oxyem.io ↗", href: "https://career.oxyem.io/", icon: Briefcase },
  { label: "Telephone", value: "+353 86 603 4988", href: "tel:+353866034988", icon: Phone },
];

/** The "What's this about?" select options, ported verbatim from the reference's `<select id="area">`. */
const PROJECT_AREAS = [
  "Digital Strategy & Consulting",
  "Experience Design & UX",
  "Software Engineering & Application Services",
  "Cloud & Digital Transformation",
  "Enterprise Integration & Modernisation",
  "Digital Commerce",
  "AI & Agentic Engineering",
  "Support for an existing platform",
];

/**
 * Field border/focus classes — a function (not a plain string) so an
 * invalid field gets a distinct red set instead of a red border class
 * layered on top of the default blue one: both sets touch the same
 * `border-color`/`focus:` utilities, and Tailwind's generated stylesheet
 * order (not the order classes appear in a `className` string) decides
 * which wins when two same-property classes are both present, so mixing
 * them via `cx` would be unreliable. Picking one full branch up front
 * avoids that entirely.
 */
function fieldClasses(hasError?: boolean) {
  return cx(
    "w-full rounded-lg border bg-[#FBFDFE] py-3 pl-11 pr-4 text-[14.5px] text-[#0B1B2B] placeholder:text-[#8598AA] transition-colors focus:bg-white focus:outline-none",
    hasError
      ? "border-[#0E9BC4] border-2 focus:border-[#0E9BC4] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.13)]"
      : "border-[#E3ECF2] focus:border-[#0E9BC4] focus:shadow-[0_0_0_3px_rgba(14,155,196,0.13)]"
  );
}

type FieldName = "name" | "email" | "phone" | "message" | "consent";

const ERROR_MESSAGES: Record<FieldName, string> = {
  name: "Please enter your name.",
  email: "Please enter a valid work email address.",
  phone: "Phone number should be 7–15 digits, numbers only.",
  message: "Tell us a little about what you need — this field can't be empty.",
  consent: "Please accept the privacy policy to continue.",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Digits only — the phone input strips everything else as the visitor types (see `handlePhoneChange`), so this just double-checks length on submit. */
const PHONE_PATTERN = /^\d{7,15}$/;

/** Strips every non-digit character from a phone input's value as the visitor types, so only numbers can ever land in the field (paste included, since this runs on the resulting `change` event either way). */
function handlePhoneChange(event: React.ChangeEvent<HTMLInputElement>) {
  event.target.value = event.target.value.replace(/\D/g, "");
}

/** Validates the intake form's required fields from a submitted `FormData`, returning one message per failing field (see `ERROR_MESSAGES`) — empty when everything's valid. */
function validateForm(data: FormData): Partial<Record<FieldName, string>> {
  const errors: Partial<Record<FieldName, string>> = {};

  const name = String(data.get("name") ?? "").trim();
  if (!name) {
    errors.name = ERROR_MESSAGES.name;
  }

  const email = String(data.get("email") ?? "").trim();
  if (!email || !EMAIL_PATTERN.test(email)) {
    errors.email = ERROR_MESSAGES.email;
  }

  // Phone is optional — only validated once something's actually been typed.
  const phone = String(data.get("phone") ?? "").trim();
  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.phone = ERROR_MESSAGES.phone;
  }

  const message = String(data.get("message") ?? "").trim();
  if (!message) {
    errors.message = ERROR_MESSAGES.message;
  }

  if (!data.get("consent")) {
    errors.consent = ERROR_MESSAGES.consent;
  }

  return errors;
}

/** The intake form's submitted shape — everything `submitContactEnquiry` needs to send on. */
interface ContactEnquiryPayload {
  name: string;
  organisation: string;
  email: string;
  phone: string;
  area: string;
  message: string;
  consent: boolean;
}

/** Builds the typed payload from the submitted `FormData` — the one place field names/casts live, so `handleSubmit` and `submitContactEnquiry` both just deal with a plain `ContactEnquiryPayload`. */
function buildPayload(data: FormData): ContactEnquiryPayload {
  return {
    name: String(data.get("name") ?? "").trim(),
    organisation: String(data.get("organisation") ?? "").trim(),
    email: String(data.get("email") ?? "").trim(),
    phone: String(data.get("phone") ?? "").trim(),
    area: String(data.get("area") ?? "").trim(),
    message: String(data.get("message") ?? "").trim(),
    consent: data.get("consent") === "on",
  };
}

/**
 * The single place the form's payload actually gets submitted from. No
 * backend is wired up yet (see the component doc below), so this just
 * logs the payload and resolves successfully — swapping in a real call
 * (e.g. `fetch("/api/contact", { method: "POST", body: JSON.stringify(payload) })`)
 * is a one-function change once an endpoint exists; nothing else in this
 * component needs to know how submission actually happens.
 */
async function submitContactEnquiry(
  payload: ContactEnquiryPayload
): Promise<{ ok: boolean }> {
  console.info("[contact-form] enquiry payload", payload);
  return { ok: true };
}

/** A field's custom validation message, rendered in red under it — replaces the browser's own default validation bubble (the form carries `noValidate`). `id` lets the field itself point to this via `aria-describedby`. */
function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} role="alert" className="mt-1.5 text-[11px] font-medium text-red-600">
      {message}
    </p>
  );
}

/**
 * The `/contact` page's routing + project-intake section — a fully
 * static, hardcoded port of `Refrence/oxytal-contact-us.html`'s `.routes`
 * and `.formwrap` sections, deliberately **not** wired to Contentful (no
 * `entry` prop is read). Both the `contactInfo` and `contactForm`
 * `composableElement` subtypes render this same component (see
 * `ComposableElementRenderer`) — only one such entry needs to exist on
 * the `/contact` page; its own fields are ignored.
 *
 * Sections, both static copy end to end:
 * - a 4-up routing grid ("Four reasons people get in touch.") — each
 *   card links out (scroll to the form below, the external careers
 *   portal, or a `mailto:` address)
 * - the intake form (name/organisation/email/phone/area/message/consent)
 *   next to an aside with a "reach us directly" contact list and a fixed
 *   "what happens next" SLA note
 *
 * Custom validation (name, work email, phone if entered, message, consent)
 * runs on submit — see `validateForm` — instead of relying on the browser's
 * own bubbles (the form carries `noValidate`); a failing field gets a red
 * border and a red message underneath it, both clearing as soon as the
 * visitor edits that field again. The phone input also strips every
 * non-digit character as it's typed (see `handlePhoneChange`) so only
 * numbers can ever land in it.
 *
 * Once every field passes, `handleSubmit` assembles one typed
 * `ContactEnquiryPayload` (see `buildPayload`) and hands it to the single
 * `submitContactEnquiry` function. No backend is wired up to receive it
 * yet, so that function just logs the payload and resolves successfully —
 * swapping in a real request there is a one-function change once an
 * endpoint exists; the button shows "Sending…" and disables itself for
 * the (currently instant) round-trip either way.
 *
 * Motion (all skipped under `prefers-reduced-motion`):
 * - the routing grid's heading and the form panel's heading each split
 *   into words and rise in as the section scrolls into view
 * - the routing cards, the form + aside cards, and the aside's contact
 *   rows each fade + rise in with a stagger as they scroll into view
 * - each contact row's icon "pops" while its arrow glyph slides
 *   up-right on hover
 */
export default function ContactFormInfo() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});

  /** Clears one field's error message as soon as the visitor edits it, rather than making them re-submit to see it go away. */
  const clearError = (field: FieldName) => {
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const nextErrors = validateForm(data);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    const { ok } = await submitContactEnquiry(buildPayload(data));
    setSubmitting(false);

    if (ok) {
      setSubmitted(true);
    }
  };

  const sectionRef = useRef<HTMLElement>(null);
  const routesHeadingRef = useRef<HTMLHeadingElement>(null);
  const formHeadingRef = useRef<HTMLHeadingElement>(null);
  const routesRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     HEADING REVEAL — the routing grid's and the form panel's
     headings each split into words and rise in on scroll, same
     GSAP split-text treatment every other section's heading uses.
     Skipped under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    const targets = [routesHeadingRef.current, formHeadingRef.current].filter(
      (el): el is HTMLHeadingElement => el !== null
    );

    if (!targets.length) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1 });
      return;
    }

    const splits: SplitText[] = [];

    const ctx = gsap.context(() => {
      targets.forEach((target) => {
        splits.push(
          SplitText.create(target, {
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
                  trigger: target,
                  start: "top 85%",
                  once: true,
                },
              }),
          })
        );
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      splits.forEach((split) => split.revert());
    };
  }, []);

  /* =========================================================
     ROUTES REVEAL — the routing cards fade + rise in with a
     stagger as the grid scrolls into view. Skipped under
     prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!routesRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(routesRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(routesRef.current!.children, {
        y: 28,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: routesRef.current,
          start: "top 88%",
          once: true,
        },
      });
    }, routesRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     CARD REVEAL — the form + aside cards fade + rise in with a
     slight stagger as the section scrolls into view. Skipped
     under prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!cardsRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(cardsRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(cardsRef.current!.children, {
        y: 32,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.15,
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, cardsRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     ROW REVEAL — the aside's contact rows fade + rise in with a
     stagger as they scroll into view. Skipped under
     prefers-reduced-motion.
  ========================================================= */
  useLayoutEffect(() => {
    if (!rowsRef.current) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(rowsRef.current.children, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(rowsRef.current!.children, {
        y: 18,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: rowsRef.current,
          start: "top 92%",
          once: true,
        },
      });
    }, rowsRef);

    return () => ctx.revert();
  }, []);

  /* =========================================================
     ROW HOVER — the icon "pops" with a quick bounce scale/rotate
     and the arrow glyph slides up-right while switching to the
     accent color; both revert on mouse-leave. Skipped under
     prefers-reduced-motion.
  ========================================================= */
  const handleRowEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const row = event.currentTarget;
    const icon = row.querySelector<HTMLElement>("[data-row-icon]");
    const arrow = row.querySelector<HTMLElement>("[data-row-arrow]");

    if (icon) {
      gsap.killTweensOf(icon);
      gsap.to(icon, { scale: 1.12, rotate: 5, duration: 0.45, ease: "back.out(2.5)" });
    }

    if (arrow) {
      gsap.killTweensOf(arrow);
      gsap.to(arrow, { x: 3, y: -3, color: "#0E9BC4", duration: 0.3, ease: "power2.out" });
    }
  };

  const handleRowLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) {
      return;
    }

    const row = event.currentTarget;
    const icon = row.querySelector<HTMLElement>("[data-row-icon]");
    const arrow = row.querySelector<HTMLElement>("[data-row-arrow]");

    if (icon) {
      gsap.killTweensOf(icon);
      gsap.to(icon, { scale: 1, rotate: 0, duration: 0.35, ease: "power2.out" });
    }

    if (arrow) {
      gsap.killTweensOf(arrow);
      gsap.to(arrow, { x: 0, y: 0, duration: 0.25, ease: "power2.out", clearProps: "color" });
    }
  };

  return (
    <section ref={sectionRef} className="relative bg-[#FBFDFE] py-16 md:py-20">
      {/* ═══ ROUTING GRID — "Four reasons people get in touch." ═══ */}
      <div className="container relative mx-auto px-5 pb-12 md:px-10 md:pb-16">
        <span className="inline-flex items-center gap-2 text-[12px] text-[#0E9BC4] font-semibold uppercase before:h-[2px] before:w-[22px] before:rounded-full before:bg-[#0E9BC4] before:content-['']">
          Start here
        </span>
        <h2
          ref={routesHeadingRef}
          className="mt-3 max-w-xl text-[28px] font-extrabold leading-[1.1] tracking-tight sm:text-[34px] md:text-[40px] text-[#0B1B2B]"
        >
          Four reasons people get in touch.
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#546A7E]">
          Pick the one that fits and you&apos;ll reach the right person first time.
        </p>

        {/* A single rounded, bordered frame divided into hairline-separated
            cells (a `gap-px` grid over a `border`-colored background, same
            trick the reference's `.routes`/`.rt` pair uses) rather than 4
            separate shadowed cards — each cell stays square-cornered on its
            own; only the frame's own corners round, via `overflow-hidden`. */}
        <div
          ref={routesRef}
          className="mt-8 grid grid-cols-1 shadow-xs gap-px overflow-hidden rounded-[18px] border border-[#E3ECF2] bg-[#E3ECF2] sm:grid-cols-2 lg:grid-cols-4"
        >
          {ROUTES.map((route) => {
            const ArrowIcon = ARROW_ICONS[route.arrow];

            return (
              <a
                key={route.title}
                href={route.href}
                target={route.external ? "_blank" : undefined}
                rel={route.external ? "noopener" : undefined}
                className="group flex flex-col bg-white px-[26px] py-7 transition-colors duration-200 hover:bg-[#F1F6F9]"
              >
                {route.badge && (
                  <span className="mb-3.5 w-fit rounded-full border border-[#E3ECF2] px-[9px] py-[3px] text-[9.5px] font-semibold tracking-[0.1em] text-[#8598AA] uppercase">
                    {route.badge}
                  </span>
                )}
                <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[#E5F5FB] text-[#0E9BC4]">
                  <route.icon size={17} aria-hidden />
                </div>
                <p className="mt-4 mb-2 text-[20px] leading-[1.3] font-bold text-[#0B1B2B]">{route.title}</p>
                <p className="mb-4 flex-1 text-[14px] leading-[1.75] text-[#546A7E]">
                  {route.description}
                </p>
                <span className="inline-flex items-center gap-[7px] text-[11px] font-semibold tracking-[0.1em] text-[#0E9BC4] uppercase">
                  {route.label}
                  <ArrowIcon
                    size={13}
                    aria-hidden
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </span>
              </a>
            );
          })}
        </div>
      </div>

      {/* ═══ FORM + ASIDE ═══ */}
      <div
        id="contact-form"
        ref={cardsRef}
        className="container relative mx-auto grid gap-6 px-5 md:px-10 lg:grid-cols-2 lg:items-start"
      >
        <div className="rounded-2xl border border-[#E3ECF2] bg-white p-7 shadow-xs md:p-9">
          <h3 ref={formHeadingRef} className="text-[21px] font-extrabold leading-[1.2] tracking-tight sm:text-[26px] md:text-[32px] text-[#0B1B2B]">
            Start a conversation.
          </h3>
          <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-[#546A7E]">
            A few lines is plenty. We&apos;d rather hear the problem in your own words than have you
            fill in fields describing it.
          </p>

          {submitted ? (
            <div className="mt-6 flex flex-col items-start gap-2 rounded-xl bg-[#E5F5FB] p-6 text-[#0B1B2B]">
              <p className="text-[15px] font-bold">Thanks — got it!</p>
              <p className="text-[14px] leading-relaxed">
                Someone from our team will get back to you within one business day.
              </p>
            </div>
          ) : (
            <form className="mt-6 flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
              {/* Spam trap — hidden from people, tempting to bots. Same
                  honeypot the reference form uses. */}
              <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
                <label htmlFor="company-website">Company website</label>
                <input type="text" id="company-website" name="company_website" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-[14px] font-medium text-[#0B1B2B]">
                    Name<span className="ml-0.5 text-[#0E9BC4]">*</span>
                  </label>
                  <div className="relative">
                    <User size={17} aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#8598AA]" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Full name"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "name-error" : undefined}
                      onChange={() => clearError("name")}
                      className={fieldClasses(Boolean(errors.name))}
                    />
                  </div>
                  <FieldError id="name-error" message={errors.name} />
                </div>
                <div>
                  <label htmlFor="org" className="mb-1.5 block text-[14px] font-medium text-[#0B1B2B]">
                    Organisation
                  </label>
                  <div className="relative">
                    <Building2 size={17} aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#8598AA]" />
                    <input id="org" name="organisation" type="text" autoComplete="organization" placeholder="Company name" className={fieldClasses()} />
                  </div>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-[14px] font-medium text-[#0B1B2B]">
                    Work email<span className="ml-0.5 text-[#0E9BC4]">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={17} aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#8598AA]" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      onChange={() => clearError("email")}
                      className={fieldClasses(Boolean(errors.email))}
                    />
                  </div>
                  <FieldError id="email-error" message={errors.email} />
                </div>
                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-[14px] font-medium text-[#0B1B2B]">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone size={17} aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#8598AA]" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={15}
                      autoComplete="tel"
                      placeholder="Phone number"
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? "phone-error" : undefined}
                      onChange={(event) => {
                        handlePhoneChange(event);
                        clearError("phone");
                      }}
                      className={fieldClasses(Boolean(errors.phone))}
                    />
                  </div>
                  <FieldError id="phone-error" message={errors.phone} />
                </div>
              </div>

              <div>
                <label htmlFor="area" className="mb-1.5 block text-[14px] font-medium text-[#0B1B2B]">
                  What&apos;s this about?
                </label>
                <div className="relative">
                  <Layers size={17} aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#8598AA]" />
                  <select id="area" name="area" defaultValue="" className={cx(fieldClasses(), "appearance-none pr-10")}>
                    <option value="">Not sure yet — I&apos;ll explain below</option>
                    {PROJECT_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} aria-hidden className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[#8598AA]" />
                </div>
                <p className="mt-1.5 text-[12.5px] text-[#8598AA]">
                  &ldquo;Not sure yet&rdquo; is a perfectly good answer — working that out is often the first piece of work.
                </p>
              </div>

              <div>
                <label htmlFor="message" className="mb-1.5 block text-[14px] font-medium text-[#0B1B2B]">
                  Tell us about it<span className="ml-0.5 text-[#0E9BC4]">*</span>
                </label>
                <div className="relative">
                  <FileText size={17} aria-hidden className="pointer-events-none absolute top-4 left-4 text-[#8598AA]" />
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder="What are you trying to achieve, and what's getting in the way? Any deadline or constraint we should know about?"
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? "message-error" : undefined}
                    onChange={() => clearError("message")}
                    className={cx(fieldClasses(Boolean(errors.message)), "resize-none")}
                  />
                </div>
                <FieldError id="message-error" message={errors.message} />
              </div>

              <div>
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="consent"
                    name="consent"
                    aria-invalid={Boolean(errors.consent)}
                    aria-describedby={errors.consent ? "consent-error" : undefined}
                    onChange={() => clearError("consent")}
                    className={cx(
                      "mt-0.5 h-[17px] w-[17px] shrink-0 accent-[#0E9BC4]"
                    )}
                  />
                  <label htmlFor="consent" className="text-[13.6px] leading-relaxed font-normal text-[#546A7E]">
                    I agree that Oxytal may use these details to respond to my enquiry, as described in the{" "}
                    <Link href="/privacy-policy" className="text-[#0E9BC4]">
                      Privacy Policy
                    </Link>
                    .<span className="ml-0.5 text-[#0E9BC4]">*</span>
                  </label>
                </div>
                <FieldError id="consent-error" message={errors.consent} />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0E9BC4] px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg transition-colors duration-200 hover:bg-[#0B87AC] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Sending…" : "Send enquiry"}
                <ArrowRight size={16} aria-hidden />
              </button>
            </form>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-[#E3ECF2] bg-white p-6 md:p-6.5 shadow-xs">
            <p className="text-[21px] font-bold text-[#0B1B2B] mb-5">Or reach us directly</p>
            <div ref={rowsRef} className="mt-3">
              {CONTACT_ROWS.map((row) => (
                <div
                  key={row.label}
                  onMouseEnter={handleRowEnter}
                  onMouseLeave={handleRowLeave}
                  className="flex items-center gap-3 border-t border-[#F1F6F9] py-4 first:border-t-0 first:pt-0"
                >
                  <div data-row-icon className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E5F5FB] text-[#0E9BC4]">
                    <row.icon size={15} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block font-semibold text-[11px] text-[#8598AA] uppercase">{row.label}</span>
                    <a
                      href={row.href}
                      target={row.href.startsWith("http") ? "_blank" : undefined}
                      rel={row.href.startsWith("http") ? "noopener" : undefined}
                      className="text-[14px] font-bold text-[#0B1B2B] transition-colors hover:text-[#0E9BC4]"
                    >
                      {row.value}
                    </a>
                  </div>
                  <ArrowUpRight data-row-arrow size={14} aria-hidden className="shrink-0 text-[#C9D6DE]" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E3ECF2] bg-white p-6 md:p-6.5 shadow-xs">
            <p className="text-[21px] font-bold text-[#0B1B2B]">What happens next</p>
            <div className="mt-3 flex items-center gap-2.5">
              <span aria-hidden className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#12A67C] shadow-[0_0_0_3px_rgba(18,166,124,0.16)]" />
              <p className="text-[13.5px] leading-relaxed text-[#546A7E]">
                A person replies within <strong className="text-[#0B1B2B]">one business day</strong> — not an
                automated acknowledgement.
              </p>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-[#8598AA]">
              If it looks like a fit, we&apos;ll suggest a call to understand the problem properly. If it isn&apos;t,
              we&apos;ll say so and point you somewhere better. Neither costs you anything.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

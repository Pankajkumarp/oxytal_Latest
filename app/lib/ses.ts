import "server-only";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { SITE_URL } from "./siteUrl";

/**
 * AWS SES integration for the `/contact` page's intake form (see
 * `app/ui/ContactFormInfo.tsx`). Sends two emails once a submission has
 * already been accepted by the existing Oxytal API
 * (`${API_URL}/oxytal/contactus` — see `submitContactEnquiry`), which
 * stays the source of truth for whether an enquiry was actually
 * received; this module only handles the follow-up notifications:
 *
 * - a confirmation to the person who submitted the form ("your request
 *   is submitted successfully, we'll be in touch within one working
 *   day")
 * - an internal notification to `CONTACT_ADMIN_EMAIL` with everything
 *   they submitted, so a person sees it land without having to check the
 *   Oxytal API's own backend
 *
 * `import "server-only"` guarantees a build fails loudly if this module
 * is ever imported from client code — it holds AWS credentials and must
 * never end up in the browser bundle. It's called from
 * `app/api/contact/route.ts` (a Next.js Route Handler), never directly
 * from `ContactFormInfo.tsx` itself.
 *
 * **Not yet configured for real sending.** `AWS_SES_ACCESS_KEY_ID`/
 * `AWS_SES_SECRET_ACCESS_KEY`/`AWS_SES_REGION`/`AWS_SES_FROM_EMAIL` are
 * all unset until someone fills them into `.env.local` (local) and the
 * hosting platform's env vars (production) — `sendContactEmails` checks
 * for that up front and, when anything's missing, logs a warning and
 * resolves without sending or throwing, so the contact form keeps
 * working (via the existing Oxytal API call) even before SES is wired
 * up. Required AWS-side setup before this can send anything: verify
 * `AWS_SES_FROM_EMAIL` (or its domain) as a sender identity in SES, and
 * — if the SES account is still in the sandbox — either move it to
 * production access or also verify every recipient address, since the
 * sandbox only allows sending to verified addresses.
 */
const SES_REGION = process.env.AWS_SES_REGION;
const SES_ACCESS_KEY_ID = process.env.AWS_SES_ACCESS_KEY_ID;
const SES_SECRET_ACCESS_KEY = process.env.AWS_SES_SECRET_ACCESS_KEY;
const SES_FROM_EMAIL = process.env.AWS_SES_FROM_EMAIL;

/** Where the internal "someone submitted the contact form" notification goes. Overridable via env (e.g. to route it at a different inbox per environment) without a code change, same fallback convention `app/lib/siteUrl.ts`'s `SITE_URL` uses. */
const CONTACT_ADMIN_EMAIL = process.env.CONTACT_ADMIN_EMAIL ?? "info@oxytal.com";

/** The same "reach us directly" general inbox/phone `ContactFormInfo.tsx`'s own `CONTACT_ROWS` shows on the `/contact` page for a *new* enquiry (not a secret — already public on the site) — used in the confirmation email's "need to add anything?" line. */
const SUPPORT_EMAIL = "info@oxytal.com";
const SUPPORT_PHONE_DISPLAY = "+353 86 603 4988";
const SUPPORT_PHONE_HREF = "+353866034988";

/**
 * Oxytal's own brand tokens — the exact same hex values
 * `TermsOfUsePage.tsx`/`PrivacyPolicyPage.tsx`/`ContactFormInfo.tsx`
 * already use (accent `#0E9BC4`, ink `#0B1B2B`, body `#546A7E`, muted
 * `#8598AA`, hairlines `#E3ECF2`/`#F1F6F9`, accent-soft `#E5F5FB`), so
 * these two emails read as the same product as the website — not the
 * unrelated teal (`#00a8cc`) the original reference template shipped
 * with.
 */
const BRAND = {
  ink: "#0B1B2B",
  body: "#546A7E",
  muted: "#8598AA",
  line: "#E3ECF2",
  lineSoft: "#F1F6F9",
  bg: "#FBFDFE",
  accent: "#0E9BC4",
  accentSoft: "#E5F5FB",
} as const;

/**
 * Poppins only, by request — no platform-specific fallback names
 * (San Francisco/Segoe UI/Roboto/etc.) in the stack, just the bare CSS
 * generic `sans-serif` as the absolute last resort so the declaration
 * stays valid CSS. Matches the `Poppins` variable font every page on
 * this site uses (see `app/(content)/[locale]/layout.tsx`'s "single
 * site font" convention). Poppins itself only actually renders where
 * `GOOGLE_FONT_LINK` below loads (see its own doc comment) — a client
 * that strips that `<link>` (Outlook desktop, the Gmail mobile app) has
 * no way to render Poppins at all and shows its own default sans-serif
 * instead; that's a real constraint of HTML email, not something this
 * stack can work around.
 */
const FONT_STACK = "'Poppins',sans-serif";

/**
 * The same Poppins `<link>` `Refrence/user_confirmation_email.html`/
 * `admin_enquiry_email.html` both shipped with — dropped when this file
 * was first rewritten as table-based/inline-styled markup, restored here
 * as a deliberate progressive enhancement: Apple/iOS Mail, Thunderbird,
 * and several webmail clients (Fastmail, ProtonMail, Gmail's own web
 * client in some contexts) *do* render a `<head>`-linked Google Font, so
 * those opens get real Poppins. Outlook desktop and the Gmail mobile app
 * strip it and silently use `FONT_STACK`'s own system-font fallback
 * instead — never a broken or blank render either way, just a plainer
 * (but still native-looking) typeface there.
 */
const GOOGLE_FONT_LINK =
  '<link rel="preconnect" href="https://fonts.googleapis.com">' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">';

let cachedClient: SESClient | null = null;

/** Lazily builds the shared `SESClient` from the env vars above — `null` when any of them is missing, which `sendContactEmails` treats as "SES isn't configured yet" rather than an error. */
function getSesClient(): SESClient | null {
  if (!SES_REGION || !SES_ACCESS_KEY_ID || !SES_SECRET_ACCESS_KEY || !SES_FROM_EMAIL) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = new SESClient({
      region: SES_REGION,
      credentials: {
        accessKeyId: SES_ACCESS_KEY_ID,
        secretAccessKey: SES_SECRET_ACCESS_KEY,
      },
    });
  }

  return cachedClient;
}

/**
 * Same shape `ContactFormInfo.tsx`'s own `ContactEnquiryPayload` submits
 * to the Oxytal API — duplicated here rather than imported, since that
 * type lives in a `"use client"` file and this module is server-only;
 * keep the two in sync by hand if the form's fields ever change.
 */
export interface ContactEnquiryEmailPayload {
  company: string;
  fullName: string;
  email: string;
  phoneNo: string;
  description: string;
  interstedIn: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Builds one label/value row for the plain `<table>`-based detail
 * blocks both emails use below. Deliberately a `<table>` row, not a
 * `display:flex`/`display:grid` div like the original reference
 * template used — those two properties have little to no support in
 * Outlook desktop (it renders email with Word's layout engine, not a
 * browser engine) and several other clients, so a "left label, right
 * value" row built with flex/grid collapses into two stacked lines
 * instead of sitting side by side. A `<table>` row is the one layout
 * primitive every major email client — Outlook included — renders
 * correctly, which is why every multi-column block in this file below
 * uses one instead.
 */
function detailRow(label: string, value: string, withBorder: boolean): string {
  const border = withBorder ? `border-bottom:1px solid ${BRAND.line};` : "";
  return `<tr>
<td style="padding:10px 18px;font-size:12px;color:${BRAND.muted};${border}white-space:nowrap;">${label}</td>
<td style="padding:10px 18px;font-size:13px;font-weight:600;color:${BRAND.ink};text-align:right;${border}">${value}</td>
</tr>`;
}

/**
 * Builds the plain-text + HTML bodies for the visitor's own confirmation
 * email. Laid out as nested `<table>`s with inline styles throughout
 * (see `detailRow`'s own doc comment for why) rather than the
 * `<style>`-block + flex/grid markup the original reference template
 * used — that combination is exactly what several major clients
 * (Outlook desktop especially) render incorrectly, which is why the
 * previous version of this template didn't "show proper" once actually
 * delivered, even though it looked fine in a browser preview.
 *
 * The copy itself now reuses this site's own established voice instead
 * of generic template filler: "Thanks — got it." and the "a person
 * replies within one business day, not an automated acknowledgement"
 * framing are the exact same lines `ContactFormInfo.tsx`'s own success
 * screen and "What happens next" card already show the visitor on the
 * page, so the email doesn't say anything the site hasn't already told
 * them. Every dynamic value is run through `escapeHtml` first — this is
 * public-form input reaching raw HTML, so it has to be escaped
 * regardless of how trustworthy a name or email usually looks.
 */
function buildUserConfirmationEmail(payload: ContactEnquiryEmailPayload) {
  const firstName = payload.fullName.trim().split(/\s+/)[0] || "there";
  const submissionDate = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const text = `Hi ${firstName},

Thanks for reaching out. Your enquiry has landed with a real person, not an automated queue — here's what happens from here.

A person replies within one business day — not an automated acknowledgement. If it looks like a fit, we'll suggest a call to understand the problem properly. If it isn't, we'll say so and point you somewhere better. Neither costs you anything.

Submitted: ${submissionDate}
Your email: ${payload.email}${payload.interstedIn ? `\nInterested in: ${payload.interstedIn}` : ""}

Need to add anything in the meantime? Email ${SUPPORT_EMAIL} or call ${SUPPORT_PHONE_DISPLAY}.

Talk soon,
The Oxytal team

—
You're receiving this because you submitted an enquiry at ${SITE_URL}.
Privacy Policy: ${SITE_URL}/privacy-policy`;

  const interestedRow = payload.interstedIn
    ? detailRow("Interested in", escapeHtml(payload.interstedIn), false)
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>Thanks — we've got your message</title>
${GOOGLE_FONT_LINK}
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:${FONT_STACK};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">A person replies within one business day — not an automated acknowledgement.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border:1px solid ${BRAND.line};border-radius:12px;">
<tr><td style="background-color:${BRAND.accent};padding:28px 36px;border-radius:12px 12px 0 0;">
<div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Oxytal</div>
<div style="margin-top:8px;font-size:16px;font-weight:700;color:#ffffff;">Thanks — got it.</div>
<div style="margin-top:5px;font-size:14px;color:rgba(255,255,255,.85);">Someone from our team will get back to you within one business day.</div>
</td></tr>
<tr><td style="padding:32px 36px;">
<p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:${BRAND.ink};">Hi ${escapeHtml(firstName)},</p>
<p style="margin:0 0 22px;font-size:14.5px;line-height:1.7;color:${BRAND.body};">Thanks for reaching out. Your enquiry has landed with a real person, not an automated queue — here's what happens from here.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
<tr><td style="background-color:${BRAND.accentSoft};border-left:3px solid ${BRAND.accent};border-radius:0 8px 8px 0;padding:18px 20px;">
<p style="margin:0 0 10px;font-size:14px;line-height:1.65;color:${BRAND.ink};">A person replies within <strong>one business day</strong> — not an automated acknowledgement.</p>
<p style="margin:0;font-size:14px;line-height:1.65;color:${BRAND.ink};">If it looks like a fit, we'll suggest a call to understand the problem properly. If it isn't, we'll say so and point you somewhere better. Neither costs you anything.</p>
</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.lineSoft};border-radius:8px;margin:0 0 24px;">
${detailRow("Submitted", escapeHtml(submissionDate), true)}
${detailRow("Your email", escapeHtml(payload.email), Boolean(interestedRow))}
${interestedRow}
</table>
<p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${BRAND.ink};">Need to add anything in the meantime?</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.body};">Email <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND.accent};text-decoration:none;">${SUPPORT_EMAIL}</a> or call <a href="tel:${SUPPORT_PHONE_HREF}" style="color:${BRAND.accent};text-decoration:none;">${SUPPORT_PHONE_DISPLAY}</a>.</p>
<p style="margin:28px 0 0;font-size:14px;line-height:1.7;color:${BRAND.body};">Talk soon,<br><strong style="color:${BRAND.ink};">The Oxytal team</strong></p>
</td></tr>
<tr><td style="padding:20px 36px;background-color:${BRAND.lineSoft};border-top:1px solid ${BRAND.line};border-radius:0 0 12px 12px;">
<p style="margin:0;font-size:11.5px;line-height:1.6;color:${BRAND.muted};">You're receiving this because you submitted an enquiry at <a href="${SITE_URL}" style="color:${BRAND.accent};text-decoration:none;">oxytal.com</a>. See our <a href="${SITE_URL}/privacy-policy" style="color:${BRAND.accent};text-decoration:none;">Privacy Policy</a> for how we handle your data.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject: "Thanks — we've got your message", text, html };
}

/**
 * Builds the plain-text + HTML bodies for the internal admin
 * notification — same `<table>`-based, inline-styled, brand-matched
 * approach as `buildUserConfirmationEmail` (see its own doc comment for
 * why). The original reference template's "Readiness Level" section has
 * no equivalent field on this site's actual intake form (see
 * `ContactFormInfo.tsx` — there's no readiness-level input), so it's
 * relabelled "Interested in" and filled with `interstedIn` (the "What's
 * this about?" dropdown) instead of inventing a value that was never
 * collected. Every dynamic value is run through `escapeHtml` first, same
 * reasoning as the user email above.
 */
function buildAdminNotificationEmail(payload: ContactEnquiryEmailPayload) {
  const firstName = payload.fullName.trim().split(/\s+/)[0] || "them";
  const company = payload.company || "Not provided";
  const interestedIn = payload.interstedIn || "Not sure yet — I'll explain below";
  const phoneDisplay = payload.phoneNo || "Not provided";

  const text = `New enquiry — ${payload.fullName}
Submitted via the /contact-us form.

Full name: ${payload.fullName}
Company: ${company}
Email: ${payload.email}
Phone: ${phoneDisplay}
Interested in: ${interestedIn}

What they're trying to achieve:
${payload.description}

Reply: mailto:${payload.email}?subject=Re: Your enquiry to Oxytal`;

  const phoneField = payload.phoneNo
    ? `<a href="tel:${encodeURIComponent(payload.phoneNo)}" style="color:${BRAND.accent};text-decoration:none;">${escapeHtml(payload.phoneNo)}</a>`
    : escapeHtml(phoneDisplay);

  const mailtoHref = `mailto:${encodeURIComponent(payload.email)}?subject=${encodeURIComponent("Re: Your enquiry to Oxytal")}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>New enquiry — ${escapeHtml(payload.fullName)}</title>
${GOOGLE_FONT_LINK}
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:${FONT_STACK};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border:1px solid ${BRAND.line};border-radius:12px;">
<tr><td style="background-color:${BRAND.accent};padding:26px 36px;border-radius:12px 12px 0 0;">
<div style="font-size:22px;font-weight:700;color:${BRAND.lineSoft};letter-spacing:-0.02em;">Oxytal</div>
<div style="margin-top:8px;font-size:16px;font-weight:700;color:#ffffff;">New enquiry — ${escapeHtml(payload.fullName)}</div>
<div style="margin-top:4px;font-size:13px;color:rgba(255,255,255,.62);">Submitted via the /contact-us form</div>
</td></tr>
<tr><td style="padding:32px 36px;">
<p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.accent};">Contact information</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid ${BRAND.line};border-radius:8px;">
${detailRow("Full name", escapeHtml(payload.fullName), true)}
${detailRow("Company", escapeHtml(company), true)}
${detailRow("Email", `<a href="mailto:${encodeURIComponent(payload.email)}" style="color:${BRAND.accent};text-decoration:none;">${escapeHtml(payload.email)}</a>`, true)}
${detailRow("Phone", phoneField, false)}
</table>
<p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.accent};">Interested in</p>
<p style="margin:0 0 24px;font-size:14px;color:${BRAND.ink};">${escapeHtml(interestedIn)}</p>
<p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.accent};">What they're trying to achieve</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
<tr><td style="background-color:${BRAND.lineSoft};border-left:3px solid ${BRAND.accent};border-radius:0 8px 8px 0;padding:16px 20px;font-size:14px;line-height:1.65;color:${BRAND.ink};">${escapeHtml(payload.description).replace(/\n/g, "<br>")}</td></tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
<tr><td style="background-color:${BRAND.accent};border-radius:8px;">
<a href="${mailtoHref}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Reply to ${escapeHtml(firstName)} &rarr;</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:18px 36px;background-color:${BRAND.lineSoft};border-top:1px solid ${BRAND.line};border-radius:0 0 12px 12px;text-align:center;">
<p style="margin:0;font-size:11px;color:${BRAND.muted};">Automated notification from the oxytal.com contact form.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return {
    subject: `New enquiry — ${payload.fullName}`,
    text,
    html,
  };
}

async function sendEmail(
  client: SESClient,
  to: string,
  { subject, text, html }: { subject: string; text: string; html: string }
) {
  await client.send(
    new SendEmailCommand({
      Source: SES_FROM_EMAIL,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Text: { Data: text, Charset: "UTF-8" },
          Html: { Data: html, Charset: "UTF-8" },
        },
      },
    })
  );
}

/**
 * Sends the visitor's confirmation email and the admin notification
 * email for one contact-form submission, in parallel. Resolves rather
 * than rejecting when SES isn't configured yet (see this module's own
 * doc comment) or when either send fails — `app/api/contact/route.ts`
 * logs the outcome but this is always a best-effort side effect, never
 * something that should surface as an error to the person who already
 * successfully submitted their enquiry to the Oxytal API.
 */
export async function sendContactEmails(
  payload: ContactEnquiryEmailPayload
): Promise<{ userEmailSent: boolean; adminEmailSent: boolean }> {
  const client = getSesClient();

  if (!client) {
    console.warn(
      "[contact-email] AWS SES isn't configured (AWS_SES_REGION/AWS_SES_ACCESS_KEY_ID/AWS_SES_SECRET_ACCESS_KEY/AWS_SES_FROM_EMAIL) — skipping confirmation/admin emails."
    );
    return { userEmailSent: false, adminEmailSent: false };
  }

  const [userResult, adminResult] = await Promise.allSettled([
    sendEmail(client, payload.email, buildUserConfirmationEmail(payload)),
    sendEmail(client, CONTACT_ADMIN_EMAIL, buildAdminNotificationEmail(payload)),
  ]);

  if (userResult.status === "rejected") {
    console.error("[contact-email] failed to send user confirmation email", userResult.reason);
  }
  if (adminResult.status === "rejected") {
    console.error("[contact-email] failed to send admin notification email", adminResult.reason);
  }

  return {
    userEmailSent: userResult.status === "fulfilled",
    adminEmailSent: adminResult.status === "fulfilled",
  };
}

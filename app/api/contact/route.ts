import { NextRequest, NextResponse } from "next/server";
import { sendContactEmails, type ContactEnquiryEmailPayload } from "@/app/lib/ses";

/**
 * Sends the two SES emails for one contact-form submission (see
 * `app/lib/ses.ts`'s own doc comment for the full picture). Called from
 * `app/ui/ContactFormInfo.tsx`'s `handleSubmit` **in addition to**, not
 * instead of, the existing direct-from-the-browser POST to the Oxytal
 * API (`${API_URL}/oxytal/contactus` — see `submitContactEnquiry`) —
 * that call remains the source of truth for whether an enquiry was
 * actually received, and this route only fires once that one has
 * already succeeded.
 *
 * A Route Handler (rather than sending from the browser) because AWS SES
 * needs real credentials, which must never reach client-side code —
 * `app/lib/ses.ts` is `import "server-only"`-guarded specifically to
 * enforce that.
 *
 * Always resolves with `{ ok: true }` unless the request body itself is
 * malformed — an SES failure (or SES simply not being configured yet,
 * see `app/lib/ses.ts`) is logged there and reported back as
 * `emailsSent: { userEmailSent: false, adminEmailSent: false }` rather
 * than a non-2xx status, since a broken confirmation email should never
 * make the *already-successful* form submission look like it failed to
 * whoever's watching the network tab.
 */
export async function POST(request: NextRequest) {
  let payload: ContactEnquiryEmailPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!payload?.email || !payload?.fullName || !payload?.description) {
    return NextResponse.json(
      { ok: false, message: "Missing required fields" },
      { status: 400 }
    );
  }

  const emailsSent = await sendContactEmails(payload);

  return NextResponse.json({ ok: true, emailsSent });
}

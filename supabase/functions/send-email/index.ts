// supabase/functions/send-email/index.ts
//
// Called by a Supabase Database Webhook whenever a row in `applications`
// is inserted or updated. Sends transactional email via Resend.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET")!;

const ADMIN_EMAIL = "admin@atlarahyperlogistics.com";
const FROM_EMAIL = "Atlara Careers <careers@atlarahyperlogistics.com>";

// ── Per-status email content ────────────────────────────────────────────────
// Each status has its own subject line and message body. Add/edit freely —
// `name` and `job` are swapped in automatically.
const STATUS_CONTENT: Record<
  string,
  { subject: (job: string) => string; body: (name: string, job: string) => string }
> = {
  received: {
    subject: (job) => `We received your application — ${job}`,
    body: (name, job) => `
      <p>Hi ${name},</p>
      <p>Thanks for applying to <strong>${job}</strong> at Atlara. We've received your application and our team is reviewing it now.</p>
      <p>We'll follow up as soon as there's an update — no action needed from you right now.</p>
      <p>— The Atlara Team</p>
    `,
  },
  under_review: {
    subject: (job) => `Your application is under review — ${job}`,
    body: (name, job) => `
      <p>Hi ${name},</p>
      <p>Good news — your application for <strong>${job}</strong> has moved to the next stage and is currently under review by our hiring team.</p>
      <p>We'll be in touch soon with next steps. Thanks for your patience.</p>
      <p>— The Atlara Team</p>
    `,
  },
  waitlisted: {
    subject: (job) => `You're on our waitlist — ${job}`,
    body: (name, job) => `
      <p>Hi ${name},</p>
      <p>Thank you for your interest in <strong>${job}</strong>. You've been placed on our waitlist for this role.</p>
      <p>This means you're still in the running — if a spot opens up or the role scope changes, we'll reach out directly.</p>
      <p>— The Atlara Team</p>
    `,
  },
  accepted: {
    subject: (job) => `Congratulations — you've been selected for ${job}`,
    body: (name, job) => `
      <p>Hi ${name},</p>
      <p>We're thrilled to let you know you've been <strong>selected</strong> for the <strong>${job}</strong> role at Atlara.</p>
      <p>Our team will reach out shortly with next steps and onboarding details. Congratulations, and welcome aboard!</p>
      <p>— The Atlara Team</p>
    `,
  },
  rejected: {
    subject: (job) => `Update on your application — ${job}`,
    body: (name, job) => `
      <p>Hi ${name},</p>
      <p>Thank you for taking the time to apply for <strong>${job}</strong> and for your interest in Atlara.</p>
      <p>After careful consideration, we've decided to move forward with other candidates for this particular role. This isn't a reflection of your abilities — we'd genuinely encourage you to apply again for future openings that match your experience.</p>
      <p>We wish you all the best in your search.</p>
      <p>— The Atlara Team</p>
    `,
  },
};

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    console.error("Resend error:", res.status, await res.text());
  }
  return res.ok;
}

serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const { type, table, record, old_record } = payload;

  try {
    if (table === "applications" && type === "INSERT") {
      const applicantName = `${record.first_name} ${record.last_name}`;

      // Notify admin of the new application
      await sendEmail(
        ADMIN_EMAIL,
        `New application: ${record.job_title}`,
        `<p><strong>${applicantName}</strong> applied for <strong>${record.job_title}</strong>.</p>
         <p>Email: ${record.email}<br/>Phone: ${record.phone}</p>
         ${record.message ? `<p>${record.message}</p>` : ""}`
      );

      // Confirmation to the applicant — uses the "received" template
      const received = STATUS_CONTENT.received;
      await sendEmail(
        record.email,
        received.subject(record.job_title),
        received.body(record.first_name, record.job_title)
      );
    }

    if (
      table === "applications" &&
      type === "UPDATE" &&
      old_record &&
      record.status !== old_record.status
    ) {
      const template = STATUS_CONTENT[record.status];

      if (template) {
        await sendEmail(
          record.email,
          template.subject(record.job_title),
          template.body(record.first_name, record.job_title)
        );
      } else {
        // Fallback for any status not in STATUS_CONTENT, so nothing silently fails
        await sendEmail(
          record.email,
          `Update on your application — ${record.job_title}`,
          `<p>Hi ${record.first_name},</p>
           <p>Your application status for <strong>${record.job_title}</strong> is now: <strong>${record.status}</strong>.</p>
           <p>— The Atlara Team</p>`
        );
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
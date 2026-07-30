// supabase/functions/send-email/index.ts
//
// Called by a Supabase Database Webhook whenever a row in `applications`
// is inserted or updated. Sends transactional email via Resend.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET")!;

const ADMIN_EMAIL = "admin@atlarahyperlogistics.com";
const FROM_EMAIL = "Atlara Careers <careers@atlarahyperlogistics.com>";

const STATUS_LABELS: Record<string, string> = {
  received: "Received",
  under_review: "Under consideration",
  waitlisted: "Waitlisted",
  accepted: "Accepted",
  rejected: "Not selected",
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
      await sendEmail(
        ADMIN_EMAIL,
        `New application: ${record.job_title}`,
        `<p><strong>${record.first_name} ${record.last_name}</strong> applied for <strong>${record.job_title}</strong>.</p>
         <p>Email: ${record.email}<br/>Phone: ${record.phone}</p>
         ${record.message ? `<p>${record.message}</p>` : ""}`
      );

      await sendEmail(
        record.email,
        `We received your application — ${record.job_title}`,
        `<p>Hi ${record.first_name},</p>
         <p>Thanks for applying to <strong>${record.job_title}</strong> at Atlara. We've received your application and will be in touch if it's a match.</p>
         <p>— The Atlara Team</p>`
      );
    }

    if (
      table === "applications" &&
      type === "UPDATE" &&
      old_record &&
      record.status !== old_record.status
    ) {
      await sendEmail(
        record.email,
        `Update on your application — ${record.job_title}`,
        `<p>Hi ${record.first_name},</p>
         <p>Your application status for <strong>${record.job_title}</strong> is now: <strong>${
          STATUS_LABELS[record.status] || record.status
        }</strong>.</p>
         <p>— The Atlara Team</p>`
      );
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
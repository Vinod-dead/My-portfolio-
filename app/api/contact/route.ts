import { NextResponse } from "next/server";

/**
 * Contact form backend.
 * Forwards the message to the URL in CONTACT_FORWARD_URL (for example a
 * Formspree endpoint). If it is not configured, the route answers 501 and the
 * UI says so; it never pretends a message was sent.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }
  const { name, email, message, website } = (body ?? {}) as Record<string, unknown>;

  // honeypot: real visitors never fill this hidden field
  if (typeof website === "string" && website.trim() !== "") return NextResponse.json({ ok: true });

  if (typeof name !== "string" || name.trim().length < 2 || name.length > 100)
    return NextResponse.json({ ok: false, error: "invalid-name" }, { status: 422 });
  if (typeof email !== "string" || !EMAIL.test(email) || email.length > 200)
    return NextResponse.json({ ok: false, error: "invalid-email" }, { status: 422 });
  if (typeof message !== "string" || message.trim().length < 10 || message.length > 4000)
    return NextResponse.json({ ok: false, error: "invalid-message" }, { status: 422 });

  const target = process.env.CONTACT_FORWARD_URL;
  if (!target) return NextResponse.json({ ok: false, error: "not-configured" }, { status: 501 });

  try {
    const res = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
    });
    if (!res.ok) return NextResponse.json({ ok: false, error: "upstream-failed" }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "upstream-unreachable" }, { status: 502 });
  }
}

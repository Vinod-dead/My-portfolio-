"use client";

import { useId, useState } from "react";
import { portfolio } from "@/data/portfolio";

type Status = "idle" | "sending" | "sent" | "not-configured" | "failed";
type Errors = Partial<Record<"name" | "email" | "message", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v: { name: string; email: string; message: string }): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = "Please enter your name (at least 2 characters).";
  if (!EMAIL.test(v.email.trim())) e.email = "Please enter a valid email address.";
  if (v.message.trim().length < 10) e.message = "Please write a message of at least 10 characters.";
  return e;
}

/**
 * Real form with validation and accessible labels. It posts to /api/contact.
 * "Sent" is shown only when the server confirms the message was forwarded.
 */
export function ContactForm() {
  const uid = useId();
  const [values, setValues] = useState({ name: "", email: "", message: "", website: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        setStatus("sent");
        setValues({ name: "", email: "", message: "", website: "" });
      } else if (res.status === 501) setStatus("not-configured");
      else setStatus("failed");
    } catch {
      setStatus("failed");
    }
  }

  const mailto = portfolio.links.email
    ? `mailto:${portfolio.links.email}?subject=${encodeURIComponent(`Hello from ${values.name || "your portfolio"}`)}&body=${encodeURIComponent(values.message)}`
    : null;

  const field = (id: "name" | "email" | "message", label: string, input: React.ReactNode) => (
    <div className="field">
      <label htmlFor={`${uid}-${id}`}>{label}</label>
      {input}
      {errors[id] && (
        <p className="field-error" id={`${uid}-${id}-err`} role="alert">
          {errors[id]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="form" aria-label="Contact form">
      {field(
        "name",
        "Your name",
        <input id={`${uid}-name`} name="name" autoComplete="name" value={values.name} onChange={set("name")} aria-invalid={!!errors.name} aria-describedby={errors.name ? `${uid}-name-err` : undefined} />,
      )}
      {field(
        "email",
        "Your email",
        <input id={`${uid}-email`} name="email" type="email" autoComplete="email" value={values.email} onChange={set("email")} aria-invalid={!!errors.email} aria-describedby={errors.email ? `${uid}-email-err` : undefined} />,
      )}
      {field(
        "message",
        "Message",
        <textarea id={`${uid}-message`} name="message" rows={4} value={values.message} onChange={set("message")} aria-invalid={!!errors.message} aria-describedby={errors.message ? `${uid}-message-err` : undefined} />,
      )}
      {/* honeypot: hidden from people, bots tend to fill it */}
      <div className="hp" aria-hidden="true">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
        </label>
      </div>
      <button className="btn btn-primary" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
      <div role="status" aria-live="polite" className="form-status">
        {status === "sent" && <p className="ok">Message sent. Thank you — Vinod will see it.</p>}
        {status === "not-configured" && (
          <p className="warn">
            The contact form isn&apos;t connected to a mail service yet, so nothing was sent.{" "}
            {mailto ? (
              <a className="link" href={mailto}>
                Open your email app instead
              </a>
            ) : (
              "Add an email address in data/portfolio.ts or set CONTACT_FORWARD_URL."
            )}
          </p>
        )}
        {status === "failed" && <p className="warn">Something went wrong and the message was not sent. Please try again in a moment.</p>}
      </div>
    </form>
  );
}

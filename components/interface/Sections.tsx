"use client";

import { portfolio } from "@/data/portfolio";
import { ContactForm } from "./ContactForm";
import { ExtLink } from "./Content";
import { audio } from "@/lib/audio";

export function ContactBlock() {
  const { email, github, linkedin, resume } = portfolio.links;
  return (
    <div className="stack">
      <ul className="contact-list">
        <li>
          <span>Email</span>
          <ExtLink href={email ? `mailto:${email}` : null}>{email ?? "Email address"}</ExtLink>
        </li>
        <li>
          <span>GitHub</span>
          <ExtLink href={github}>github</ExtLink>
        </li>
        <li>
          <span>LinkedIn</span>
          <ExtLink href={linkedin}>linkedin</ExtLink>
        </li>
        <li>
          <span>Résumé</span>
          <ExtLink href={resume} hint="Résumé not added yet — put a PDF in /public and set links.resume in data/portfolio.ts">
            Download résumé
          </ExtLink>
        </li>
      </ul>
      <ContactForm />
    </div>
  );
}

export function FinaleLinks({ onReplay }: { onReplay: () => void }) {
  return (
    <div className="links links-center">
      <ExtLink href={portfolio.links.github}>Explore GitHub</ExtLink>
      <ExtLink href={portfolio.links.linkedin}>Connect on LinkedIn</ExtLink>
      <button
        type="button"
        className="btn"
        onClick={() => {
          audio.tick();
          onReplay();
        }}
      >
        Back to the beginning
      </button>
    </div>
  );
}

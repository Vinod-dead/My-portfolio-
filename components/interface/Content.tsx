import type { ReactNode } from "react";
import { isPlaceholder, portfolio } from "@/data/portfolio";
import { exploring, skillGroups, type SkillGroup } from "@/data/skills";
import type { Project } from "@/data/projects";

/**
 * Content blocks shared by the cinematic overlay and the classic (no-WebGL) view.
 * Placeholder strings from /data are rendered in an obviously-unfinished style.
 */

export function T({ children }: { children: string }) {
  if (isPlaceholder(children)) {
    const text = children.replace(/^\[PLACEHOLDER:?\s*/, "").replace(/\]$/, "");
    return (
      <span className="ph" title="Placeholder — edit this in the /data folder">
        <b>Add</b> {text}
      </span>
    );
  }
  return <>{children}</>;
}

export function ExtLink({ href, children, hint }: { href: string | null; children: ReactNode; hint?: string }) {
  if (!href) {
    return (
      <span className="link-off" aria-disabled="true" title={hint ?? "Link not set yet — add it in the /data folder"}>
        {children} <small>(not set)</small>
      </span>
    );
  }
  const external = /^https?:/.test(href);
  return (
    <a className="link" href={href} {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}>
      {children}
    </a>
  );
}

export const About = () => <p className="lead">{portfolio.about.summary}</p>;

export const Interests = () => (
  <ul className="bullets">
    {portfolio.about.interests.map((i) => (
      <li key={i}>{i}</li>
    ))}
  </ul>
);

export const Approach = () => (
  <p className="lead">
    <T>{portfolio.about.approach}</T>
  </p>
);

export const Learning = () => (
  <ul className="bullets">
    {portfolio.about.currentlyLearning.map((i) => (
      <li key={i}>
        <T>{i}</T>
      </li>
    ))}
  </ul>
);

export const Education = () => (
  <div className="stack">
    {portfolio.education.map((e, i) => (
      <div key={i}>
        <p className="lead">
          <T>{e.institution}</T>
        </p>
        <p className="muted">
          <T>{e.program}</T>
        </p>
        <p className="muted">
          <T>{e.period}</T>
        </p>
        {e.notes && <p className="muted">{e.notes}</p>}
      </div>
    ))}
  </div>
);

export const Chips = ({ items }: { items: string[] }) => (
  <ul className="chips">
    {items.map((s) => (
      <li key={s} className={s.startsWith("[PLACEHOLDER") ? "chip chip-ph" : "chip"}>
        <T>{s}</T>
      </li>
    ))}
  </ul>
);

export const Groups = ({ groups, compact = false }: { groups: SkillGroup[]; compact?: boolean }) => (
  <div className={compact ? "groups groups-compact" : "groups"}>
    {groups.map((g) => (
      <section key={g.title}>
        <h4>{g.title}</h4>
        <Chips items={g.items} />
      </section>
    ))}
  </div>
);

export const Exploring = () => (
  <>
    <Chips items={exploring} />
    <p className="muted small">Technologies currently being explored.</p>
  </>
);

export const SKILLS = {
  programming: skillGroups.slice(0, 1),
  ai: skillGroups.slice(1, 3),
  tools: skillGroups.slice(3),
  all: skillGroups,
};

const STATUS: Record<Project["status"], string> = {
  project: "Project",
  "in-progress": "In progress",
  concept: "Concept — not built yet",
};

export function ProjectBlock({ project }: { project: Project }) {
  const isConcept = project.status === "concept";
  return (
    <div className="stack">
      <p className={`badge badge-${project.status}`}>{STATUS[project.status]}</p>
      <p className="lead">{project.summary}</p>
      <section>
        <h4>{isConcept ? "Planned capabilities" : "Key features"}</h4>
        <ul className="bullets">
          {project.features.map((f) => (
            <li key={f}>
              <T>{f}</T>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h4>{isConcept ? "Planned stack" : "Technology stack"}</h4>
        <Chips items={project.stack} />
      </section>
      <div className="links">
        <ExtLink href={project.repo}>{isConcept ? "Repository / prototype" : "GitHub repository"}</ExtLink>
        {!isConcept || project.demo ? <ExtLink href={project.demo}>Live demo</ExtLink> : null}
      </div>
    </div>
  );
}

import { portfolio } from "@/data/portfolio";
import { projects } from "@/data/projects";
import { About, Approach, Education, Exploring, Groups, Interests, Learning, ProjectBlock, SKILLS } from "./Content";
import { ContactBlock } from "./Sections";

const REASONS: Record<string, string> = {
  webgl: "Your browser couldn't start 3D graphics, so here is the full portfolio as a regular page.",
  reduced: "Your system asks for reduced motion, so the animated 3D journey is switched off. You can still enter it from the top bar.",
  error: "The 3D scene ran into a problem, so here is the full portfolio as a regular page.",
  chosen: "",
};

/** Full portfolio as a plain, accessible page. Used when WebGL is unavailable or by choice. */
export function ClassicView({ reason }: { reason: keyof typeof REASONS }) {
  const note = REASONS[reason];
  return (
    <main id="content" className="classic">
      <section className="classic-hero">
        {note && <p className="notice" role="note">{note}</p>}
        <p className="eyebrow">Portfolio</p>
        <h1 className="display">{portfolio.name}</h1>
        <p className="hero-role">{portfolio.tagline.toUpperCase()}</p>
        <p className="lead">{portfolio.heroSupport}</p>
        <nav aria-label="Sections" className="classic-nav">
          {[
            ["about", "About"],
            ["education", "Education"],
            ["projects", "Projects"],
            ["skills", "Skills"],
            ["contact", "Contact"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="btn btn-ghost">
              {label}
            </a>
          ))}
        </nav>
      </section>

      <section id="about" aria-labelledby="h-about">
        <h2 id="h-about" className="display">About</h2>
        <About />
        <h3>Interests</h3>
        <Interests />
        <h3>Approach to problem-solving</h3>
        <Approach />
        <h3>Current learning journey</h3>
        <Learning />
      </section>

      <section id="education" aria-labelledby="h-edu">
        <h2 id="h-edu" className="display">Education</h2>
        <Education />
      </section>

      <section id="projects" aria-labelledby="h-proj">
        <h2 id="h-proj" className="display">Projects</h2>
        <div className="project-grid">
          {projects.map((p) => (
            <article key={p.id} className="holo" style={{ ["--accent" as string]: p.accent }}>
              <h3 className="display">{p.name}</h3>
              <ProjectBlock project={p} />
            </article>
          ))}
        </div>
      </section>

      <section id="skills" aria-labelledby="h-skills">
        <h2 id="h-skills" className="display">Skills &amp; technologies</h2>
        <Groups groups={SKILLS.all} />
        <h3>Currently exploring</h3>
        <Exploring />
      </section>

      <section id="contact" aria-labelledby="h-contact">
        <h2 id="h-contact" className="display">Contact</h2>
        <ContactBlock />
      </section>

      <footer>
        <p className="display">Thank you for visiting.</p>
        <p className="muted">&ldquo;{portfolio.finalQuote}&rdquo;</p>
      </footer>
    </main>
  );
}

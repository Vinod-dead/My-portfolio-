# Vinod Reddy — Immersive 3D Robot Portfolio

A scroll-driven cinematic portfolio. A small white-and-blue robot guides the visitor through eight chapters:
it arrives, walks through the introduction, rides a scooter past education and skills, takes off with its
head rotor, visits three project worlds, explores an invention lab, reaches a contact terminal and ends with a
Namaskar.

Everything in the 3D scene is built from code (no external model, texture or audio files), so the project runs
offline and has no licensing dependencies.

**Stack:** Next.js (App Router) · React · TypeScript · Three.js · React Three Fiber · drei · GSAP + ScrollTrigger ·
Framer Motion · Tailwind CSS · Web Audio API.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Checks: `npm run lint` and `npm run typecheck`.

Useful URL: `/?at=0.5` jumps straight to 50% of the journey (handy for testing or deep links).

## Edit your content (no code changes needed)

| What | File |
| --- | --- |
| Name, tagline, about, interests, approach, learning, education, GitHub / LinkedIn / email / resume | `data/portfolio.ts` |
| Projects (summary, features, stack, repo, demo, status) — add an object to add a project | `data/projects.ts` |
| Skill groups | `data/skills.ts` |
| Robot dialogue lines | `data/story.ts` |
| Music source and default volume | `data/audio.ts` |

Anything shown as `[PLACEHOLDER: ...]` is information I did not have. It renders as a clearly marked placeholder
chip — replace it with real content. Links set to `null` are hidden until you add them, so there are never dead
buttons. No proficiency percentages or statistics are invented.

**Things you need to supply:** education details, skills, tech stacks and real features for QuizForge and the
Travel Planner, your problem-solving approach, current learning, email / GitHub / LinkedIn URLs, a resume
(put the PDF in `public/` and set `links.resume`, e.g. `"/resume.pdf"`).

## Contact form

The form validates on the client and again on the server (`app/api/contact/route.ts`). It forwards messages to
the URL in `CONTACT_FORWARD_URL` (for example a Formspree endpoint). If that variable is not set, the form says
plainly that sending is not configured and offers a `mailto:` link when an email is set. It never shows a success
message unless the upstream service accepted the message.

```bash
cp .env.example .env.local
# set CONTACT_FORWARD_URL=https://formspree.io/f/xxxxxxxx
```

## Audio

The soundtrack is an original generative ambient piece (soft pads, sparse piano-like notes, gentle bass,
long reverb) synthesised in the browser. Sound is **off until the visitor turns it on**, which satisfies browser
autoplay rules. The audio menu offers on/off, music volume, sound effects (footsteps, scooter, rotor, UI) on/off,
and optional spoken dialogue via the browser's speech synthesis. Captions are always shown.

To use your own licensed or original track: put an MP3/OGG in `public/audio/` and set `musicSrc: "/audio/your-file.mp3"`
in `data/audio.ts`.

## How the story works

* `lib/layout.ts` — world coordinates and chapter spans.
* `lib/timeline.ts` — the master timeline: one pure function turns scroll progress (0–1) into robot pose mode,
  scooter state and camera shot.
* `lib/robotPose.ts` — joint targets for each mode (walk, ride, takeoff, fly, land, Namaskar, …).
* `components/experience/` — canvas, camera rig, robot, scooter, atmosphere, story driver.
* `components/scenes/` — one file per scene.
* `components/interface/` — HTML overlay, dialogue captions, navigation, audio controls, classic view.

## Replace the robot

The robot is a procedural rig in `components/experience/RobotCharacter.tsx`. Animation is driven by named joints
(`head`, `armL/R`, `elbowL/R`, `hipL/R`, `kneeL/R`, `rotor`, eyes). To use a rigged GLB instead, load it with
drei's `useGLTF` and map your nodes to the same refs; the pose tables in `lib/robotPose.ts` and the timeline
stay unchanged. Put the file in `public/models/`. Body proportions live in `lib/robotDims.ts`.

## Accessibility, fallback and performance

* **Classic view**: a plain, fully semantic version of every section. It is shown automatically when WebGL is
  unavailable, when the 3D scene crashes, or when the visitor prefers reduced motion, and can be toggled at any
  time from the header.
* Keyboard-reachable chapter navigation, skip link, visible focus, labelled icon buttons, live captions.
* `prefers-reduced-motion` disables scroll smoothing and camera choreography.
* Low-power devices get a lighter scene (fewer particles and instances, lower pixel ratio).
* The loading screen shows an indeterminate state only (nothing is generated procedurally from files, so there is
  no real percentage to report) and always offers a link to the classic view.

## Deploying

Any Node host works (Vercel is the simplest). Set `CONTACT_FORWARD_URL` in the host's environment variables.
The contact route needs a server runtime, so do not use `next export` unless you drop the form.

## Known limitations

* The reference robot image was not available to me when building this, so the robot follows your written
  description (glossy white body, blue accents, black face screen with blue eyes, compact humanoid, head rotor).
  Compare it with your image and adjust colours and proportions in `lib/robotDims.ts` and `RobotCharacter.tsx`.
* Models are procedural, not Blender-authored. Animation is procedural too.
* Frame rate was not measured on real GPUs; testing here used software rendering.
* Spoken dialogue depends on the voices installed in the visitor's browser.

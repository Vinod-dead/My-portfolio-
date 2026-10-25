/**
 * EDIT THIS FILE with skills you can genuinely vouch for.
 * No proficiency percentages on purpose. Groups with only placeholders show
 * a clearly marked placeholder in the UI until you replace them.
 */

export interface SkillGroup {
  title: string;
  items: string[];
}

const P = (what: string) => `[PLACEHOLDER: ${what}]`;

export const skillGroups: SkillGroup[] = [
  { title: "Programming", items: [P("Python (Primary), JavaScript, SQL, C")] },
  { title: "AI and machine learning", items: [P("NumPy, Pandas, Matplotlib, Power BI, Scikit-learn,NoSQL")] },
  { title: "LLMs and agent frameworks", items: [P("OpenAI-compatible APIs, NVIDIA NIM / API, REST APIs,LangGraph, LangChain, OpenAI Agents SDK, n8n ")] },
  { title: "Backend development", items: [P("FastAPI, Python, REST APIs, Git, GitHub")] },
  { title: "Frontend development", items: [P("HTML, CSS, JavaScript, React.js, Next.js")] },
  { title: "Developer tools", items: [P("VS Code, Git, GitHub, Jupyter Notebook, Google Colab, Claude Code")] },
];

/** Shown on the scooter ride (Education and Skills chapter). */
export const exploring: string[] = [
  "Multi-agent systemsAND AI applications",
  "Creative coding and interactive 3D",
  "MCP (Model Context Protocol)",
  "RAG (Retrieval-Augmented Generation)"
];

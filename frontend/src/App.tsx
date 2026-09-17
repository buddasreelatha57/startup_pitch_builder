import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  ArrowRight,
  Brain,
  Check,
  ChevronDown,
  Download,
  Eye,
  History,
  LayoutTemplate,
  LogOut,
  Plus,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";
import jsPDF from "jspdf";
import pptxgen from "pptxgenjs";
import "./App.css";
import "./Auth.css";
const _apiRaw = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const api = _apiRaw.replace(/\/+$/, '') + (_apiRaw.replace(/\/+$/, '').endsWith('/api') ? "" : "/api");
const steps = [
  "Startup Details",
  "Reference Decks",
  "AI Analysis",
  "Pitch Generation",
  "Pitch Editor",
  "Pitch Score",
  "Export",
];
async function q(path: string, method = "GET", body?: any, form = false) {
  const r = await fetch(api + path, {
    method,
    headers: {
      ...(localStorage.token
        ? { Authorization: "Bearer " + localStorage.token }
        : {}),
      ...(body && !form ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? (form ? body : JSON.stringify(body)) : undefined,
  });
  const j = await r.json();
  if (!r.ok) throw Error(j.error);
  return j;
}
function Shell({ children }: any) {
  const signedIn = Boolean(localStorage.token);

  return (
    <>
      <nav>
        <Link to="/" className="brand">
          pitch<span>craft</span>
        </Link>
        <span />
        <Link to="/dashboard">Workspace</Link>
        {!signedIn && (
          <Link className="outline" to="/login">
            Sign in
          </Link>
        )}
      </nav>
      {children}
    </>
  );
}
function Progress({ active }: any) {
  return (
    <div className="progress">
      {steps.map((x, i) => (
        <div key={x} className={i <= active ? "done" : ""}>
          <i>
            {i < active ? <Check size={12} /> : String(i + 1).padStart(2, "0")}
          </i>
          <span>{x}</span>
        </div>
      ))}
    </div>
  );
}
function Home() {
  return (
    <Shell>
      <main className="hero">
        <b>AI-POWERED PITCH INTELLIGENCE</b>
        <h1>
          Turn your startup idea into an <i>investor-ready</i> pitch.
        </h1>
        <p>
          Build a compelling 10-slide investor story grounded in proven
          reference decks.
        </p>
        <Link className="primary" to="/register">
          Build my pitch <ArrowRight size={16} />
        </Link>
      </main>
    </Shell>
  );
}
function Auth({ reg = false }: any) {
  const n = useNavigate(),
    [show, setShow] = useState(false),
    [error, setError] = useState("");
  async function go(e: any) {
    e.preventDefault();
    setError("");
    try {
      const r = await q(
        "/auth/" + (reg ? "register" : "login"),
        "POST",
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      localStorage.token = r.token;
      localStorage.user = JSON.stringify(r.user);
      n("/dashboard");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Unable to continue");
    }
  }
  return (
    <Shell>
      <main className="auth">
        <form onSubmit={go}>
          <b>{reg ? "CREATE YOUR ACCOUNT" : "SECURE SIGN IN"}</b>
          <h1>{reg ? "Build your investor story." : "Welcome back."}</h1>
          {reg && (
            <label className="auth-label">
              Name
              <input name="name" placeholder="Your name" required />
            </label>
          )}
          <label className="auth-label">
            Work email
            <input
              name="email"
              type="email"
              placeholder="Work email"
              required
            />
          </label>
          <label className="auth-label">
            Password
            <div className="password-field">
              <input
                name="password"
                type={show ? "text" : "password"}
                placeholder="Password"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </label>
          <p className="err">{error}</p>
          <button className="primary">
            Continue <ArrowRight size={16} />
          </button>
          <p className="auth-switch">
            {reg ? "Already have an account? " : "Need an account? "}
            <Link to={reg ? "/login" : "/register"}>
              {reg ? "Sign in" : "Create account"}
            </Link>
          </p>
        </form>
      </main>
    </Shell>
  );
}
const sampleSlides = [
  {
    title: "AI for small teams",
    theme: "signal",
    category: "SaaS / Productivity",
    description: "A focused story for turning manual work into an intelligent workflow.",
    startupName: "FlowPilot",
    idea: "Small teams lose hours to repetitive operational work. FlowPilot uses AI to automate routine workflows while keeping people in control.",
    targetAudience: "Operations teams at growing startups",
    industry: "SaaS",
    market: "Global",
  },
  {
    title: "Climate intelligence",
    theme: "terra",
    category: "ClimateTech",
    description: "Lead with a measurable climate problem and a clear path to impact.",
    startupName: "TerraSignal",
    idea: "Businesses struggle to turn climate data into practical decisions. TerraSignal converts satellite and operations data into actionable reduction plans.",
    targetAudience: "Sustainability leaders at mid-market companies",
    industry: "ClimateTech",
    market: "North America",
  },
  {
    title: "The modern marketplace",
    theme: "editorial",
    category: "Marketplace",
    description: "A balanced two-sided marketplace narrative built around trust and liquidity.",
    startupName: "CraftLink",
    idea: "Independent makers struggle to reach reliable buyers. CraftLink connects verified creators with customers looking for distinctive, responsibly made goods.",
    targetAudience: "Design-conscious online shoppers",
    industry: "Marketplace",
    market: "United Kingdom",
  },
  {
    title: "Fintech for the overlooked",
    theme: "ledger",
    category: "Fintech",
    description: "Frame an underserved customer segment with a practical financial product.",
    startupName: "LedgerLift",
    idea: "Freelancers have unpredictable cash flow and limited access to useful credit. LedgerLift gives independent workers flexible cash-flow tools built around their real income.",
    targetAudience: "Independent professionals and freelancers",
    industry: "Fintech",
    market: "India",
  },
  {
    title: "Healthcare, made simpler",
    theme: "care",
    category: "HealthTech",
    description: "A patient-first pitch structure for reducing friction in care delivery.",
    startupName: "CareRoute",
    idea: "Patients often lose time navigating fragmented care. CareRoute brings appointments, records, and follow-ups into one simple care journey.",
    targetAudience: "Families managing recurring healthcare",
    industry: "HealthTech",
    market: "Australia",
  },
];
function Dash() {
  const [ps, setPs] = useState<any[]>([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.user || "null");
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }
  useEffect(() => {
    q("/projects")
      .then(setPs)
      .catch(() => {});
  }, []);
  return (
    <Shell>
      <main className="dash dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="sidebar-label"><History size={14} /> HISTORY</div>
          <Link className="sidebar-link active" to="/dashboard">All pitches <span>{ps.length}</span></Link>
          <div className="sidebar-divider" />
          <div className="sidebar-label"><LayoutTemplate size={14} /> SAMPLE SLIDES</div>
          <div className="sample-list">
            {sampleSlides.map((sample) => (
              <div className="sample-slide" key={sample.title}>
                <div className={`sample-preview sample-preview-${sample.theme}`}><span>{sample.title.slice(0, 1)}</span></div>
                <div className="sample-copy">
                  <strong>{sample.title}</strong>
                  <small>{sample.category}</small>
                  <button onClick={() => navigate("/new", { state: { sample } })}>Use it <ArrowRight size={12} /></button>
                </div>
              </div>
            ))}
          </div>
          <button className="sidebar-logout" onClick={logout}><LogOut size={14} /> Logout</button>
        </aside>
        <section className="dashboard-content">
        <header>
          <div>
            <b>YOUR WORKSPACE</b>
            <h1>{user?.name ? `Welcome, ${user.name}.` : "Make the case."}</h1>
          </div>
          <Link className="primary" to="/new">
            <Plus size={16} /> New pitch
          </Link>
        </header>
        <div className="projects">
          {ps.map((p) => (
            <div className="card" key={p.id}>
              <em>{p.startupName[0]}</em>
              <h3>{p.startupName}</h3>
              <p>
                {p.industry} · {p.market}
              </p>
              <Link to={"/project/" + p.id}>
                Open <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
        </section>
      </main>
    </Shell>
  );
}
function New() {
  const n = useNavigate(),
    location = useLocation(),
    [more, setMore] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const sample = location.state?.sample;
  async function go(e: any) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const p = await q(
        "/projects",
        "POST",
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      n("/project/" + p.id);
    } catch (x) {
      setError(
        x instanceof Error
          ? x.message
          : "Unable to continue. Please sign in and try again.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <Shell>
      <Progress active={0} />
      <main className="form">
        <form onSubmit={go} className="startup-form">
          <input type="hidden" name="template" value={sample?.theme || "signal"} />
          <b>01 — STARTUP DETAILS</b>
          <h1>Tell us what you’re building.</h1>
          <p>
            Start with the essentials. You’ll add reference decks before we
            generate a word.
          </p>
          <label>
            Startup Name
            <input
              name="startupName"
              placeholder="e.g. FarmConnect AI"
              defaultValue={sample?.startupName}
              required
            />
          </label>
          <label>
            What are you building? / Problem + Solution
            <textarea
              name="idea"
              placeholder="Describe the customer problem and your solution."
              defaultValue={sample?.idea}
              minLength={20}
              required
            />
          </label>
          <label>
            Target Audience
            <input
              name="targetAudience"
              placeholder="e.g. Independent restaurants"
              defaultValue={sample?.targetAudience}
              required
            />
          </label>
          <div className="two">
            <label>
              Industry / Vertical
              <input name="industry" placeholder="e.g. AgriTech" defaultValue={sample?.industry} required />
            </label>
            <label>
              Geographic Market
              <input name="market" placeholder="e.g. India" defaultValue={sample?.market} required />
            </label>
          </div>
          <button
            type="button"
            className="advanced"
            aria-expanded={more}
            onClick={() => setMore(!more)}
          >
            Advanced Details{" "}
            <ChevronDown size={15} className={more ? "rotate" : ""} />
          </button>
          {more && (
            <div className="advanced-grid">
              <label>
                Revenue Model
                <input name="revenueModel" placeholder="Optional" />
              </label>
              <label>
                Current Traction
                <textarea name="traction" placeholder="Optional" />
              </label>
              <label>
                Team Information
                <textarea name="team" placeholder="Optional" />
              </label>
              <label>
                Funding Requirement
                <input name="funding" placeholder="Optional" />
              </label>
            </div>
          )}
          <p className="err">{error}</p>
          <button className="primary" disabled={saving}>
            {saving ? "Saving details…" : "Continue to Reference Decks"}{" "}
            <ArrowRight size={16} />
          </button>
        </form>
      </main>
    </Shell>
  );
}
const analysis = [
  "Reading PDF documents",
  "Extracting slide content",
  "Splitting content into meaningful sections",
  "Generating embeddings",
  "Indexing reference material",
  "Identifying pitch patterns",
  "Preparing semantic retrieval",
];
const building = [
  "Understanding startup",
  "Retrieving relevant reference patterns",
  "Analyzing market positioning",
  "Structuring business model",
  "Building market opportunity",
  "Generating financial narrative",
  "Refining investor story",
  "Preparing slides",
];
function Pipeline({ title, items }: any) {
  return (
    <section className="pipeline">
      <b>AI WORKFLOW</b>
      <h1>{title}</h1>
      {items.map((x: string, i: number) => (
        <div className="task" key={x}>
          <i>{i < 3 ? <Check size={12} /> : String(i + 1).padStart(2, "0")}</i>
          {x}
          <small>
            {i < 3 ? "Complete" : i === 3 ? "In progress" : "Queued"}
          </small>
        </div>
      ))}
    </section>
  );
}
function Project() {
  const { id = "" } = useParams(),
    n = useNavigate(),
    [p, setP] = useState<any>(),
    [pitch, setPitch] = useState<any>(),
    [stage, setStage] = useState("refs"),
    [slide, setSlide] = useState(0);
  useEffect(() => {
    q("/projects/" + id)
      .then((x) => {
        setP(x);
        if (x.status === "Ready") {
          setStage("editor");
          q("/projects/" + id + "/pitch").then(setPitch);
        }
      })
      .catch(() => n("/dashboard"));
  }, [id, n]);
  async function upload(e: any) {
    for (const f of Array.from(e.target.files || []) as any[]) {
      if (f.type === "application/pdf") {
        const d = new FormData();
        d.append("file", f);
        await q("/projects/" + id + "/references", "POST", d, true);
      }
    }
    setP(await q("/projects/" + id));
  }
  async function generate() {
    const r = await q("/projects/" + id + "/generate", "POST");
    setPitch(r);
    setStage("editor");
  }
  async function exportPdf() {
    if (!pitch || !pitch.slides) return;
    const doc = new jsPDF({ orientation: "landscape" });
    pitch.slides.forEach((s: any, i: number) => {
      if (i > 0) doc.addPage();
      doc.setFontSize(24);
      doc.text(s.title || "", 20, 30);
      doc.setFontSize(16);
      doc.text(s.subtitle || "", 20, 45);
      doc.setFontSize(12);
      let y = 60;
      (s.content || []).forEach((c: string) => {
        const lines = doc.splitTextToSize(`• ${c}`, 250);
        doc.text(lines, 20, y);
        y += 7 * lines.length;
      });
    });
    doc.save(`${p.startupName}_Pitch.pdf`);
  }
  async function exportPptx() {
    if (!pitch || !pitch.slides) return;
    const ppt = new pptxgen();
    const theme = pitch.theme || { background: "10282c", accent: "20c5b3", text: "f1fffd", muted: "91aaa8" };
    pitch.slides.forEach((s: any) => {
      const slide = ppt.addSlide();
      slide.background = { color: theme.background };
      slide.addText(s.title || "", {
        x: 0.5,
        y: 0.5,
        w: "90%",
        h: 1,
        fontSize: 32,
        bold: true,
        color: theme.accent,
      });
      slide.addText(s.subtitle || "", {
        x: 0.5,
        y: 1.5,
        w: "90%",
        h: 1,
        fontSize: 18,
        color: theme.muted,
      });
      const bulletItems = (s.content || []).map((c: string) => ({
        text: c,
        options: { bullet: true },
      }));
      if (bulletItems.length > 0) {
        slide.addText(bulletItems as any, {
          x: 0.5,
          y: 2.5,
          w: "90%",
          h: 4,
          fontSize: 14,
          valign: "top",
          color: theme.text,
        });
      }
    });
    ppt.writeFile({ fileName: `${p.startupName}_Pitch.pptx` });
  }
  async function improveSlide(instruction: string) {
    if (!pitch || !pitch.slides) return;
    const updatedSlide = await q(
      "/projects/" + id + "/slides/" + pitch.slides[slide].id + "/improve",
      "POST",
      { instruction },
    );
    const newPitch = { ...pitch, slides: [...pitch.slides] };
    newPitch.slides[slide] = updatedSlide;
    setPitch(newPitch);
  }
  if (!p)
    return (
      <Shell>
        <main className="dash">Loading…</main>
      </Shell>
    );
  if (stage === "refs")
    return (
      <Shell>
        <Progress active={1} />
        <main className="reference-page">
          <b>02 — REFERENCE DECKS</b>
          <h1>Build Your Pitch From Proven Patterns</h1>
          <p>
            Upload investor pitch decks to help the AI understand successful
            structures, storytelling patterns, benchmarks, and investor
            expectations.
          </p>
          <label className="dropzone">
            <Upload size={26} />
            <h3>Drop PDF decks here</h3>
            <p>Upload multiple files — PDF only, 25 MB maximum each.</p>
            <span className="outline">Browse Files</span>
            <input
              type="file"
              multiple
              accept="application/pdf"
              onChange={upload}
            />
          </label>
          <section className="library">
            <b>REFERENCE LIBRARY</b>
            <h2>{p.references.length} decks indexed</h2>
            {p.references.map((r: any) => (
              <div className="reference-row" key={r.id}>
                <Check size={15} />
                <span>
                  <strong>{r.fileName}</strong>
                  <small>Indexed — semantic retrieval ready</small>
                </span>
                <em>PROCESSED</em>
              </div>
            ))}
          </section>
          <button
            className="primary wide"
            disabled={!p.references.length}
            onClick={() => setStage("analysis")}
          >
            Analyze Reference Library <ArrowRight size={16} />
          </button>
        </main>
      </Shell>
    );
  if (stage === "analysis")
    return (
      <Shell>
        <Progress active={2} />
        <main className="workflow">
          <Pipeline title="Analyzing Your Reference Library" items={analysis} />
          <section className="intelligence">
            <b>REFERENCE INTELLIGENCE</b>
            <h2>Patterns ready for retrieval.</h2>
            <div className="insights">
              {[
                "Problem → Solution storytelling",
                "Market sizing patterns",
                "Business model patterns",
                "Competitive positioning",
                "Go-to-market structures",
                "Traction metrics",
                "Funding ask patterns",
              ].map((x) => (
                <span key={x}>✓ {x}</span>
              ))}
            </div>
            <div className="insight-stats">
              <div>
                <strong>{p.references.length}</strong> decks analyzed
              </div>
              <div>
                <strong>{p.references.length * 10}</strong> slides processed
              </div>
              <div>
                <strong>{p.references.length * 143}</strong> semantic chunks
                indexed
              </div>
            </div>
            <button className="primary" onClick={() => setStage("generate")}>
              Generate My Pitch <ArrowRight size={16} />
            </button>
          </section>
        </main>
      </Shell>
    );
  if (stage === "generate")
    return (
      <Shell>
        <Progress active={3} />
        <main className="workflow">
          <Pipeline title="Building Your Investor Pitch" items={building} />
          <div className="slide-count">
            <strong>10 / 10 slides generated</strong>
            <button className="primary" onClick={generate}>
              Open pitch editor <Sparkles size={16} />
            </button>
          </div>
        </main>
      </Shell>
    );
  if (!pitch)
    return (
      <Shell>
        <main className="dash">Loading pitch…</main>
      </Shell>
    );
  const s = pitch?.slides[slide];
  return (
    <Shell>
      <Progress active={4} />
      <main className="workspace">
        <header>
          <div>
            <b>05 — PITCH EDITOR</b>
            <h1>{p.startupName}</h1>
            <small>Autosaved just now</small>
          </div>
          <div>
            <button className="outline">
              <Eye size={15} /> Preview
            </button>
            <button className="primary">
              <Download size={15} /> Export
            </button>
          </div>
        </header>
        <div className="editor">
          <aside>
            {pitch.slides.map((x: any, i: number) => (
              <button
                className={i === slide ? "sel" : ""}
                onClick={() => setSlide(i)}
              >
                0{i + 1} {x.title}
              </button>
            ))}
          </aside>
          <article className={`pitch-theme-${pitch.theme?.id || "signal"}`} key={JSON.stringify(s)}>
            <small>
              0{s.slideNumber} — {s.type.toUpperCase()}
            </small>
            <h2 contentEditable suppressContentEditableWarning>
              {s.title}
            </h2>
            <p contentEditable suppressContentEditableWarning>
              {s.subtitle}
            </p>
            {s.content.map((x: string) => (
              <div
                className="bullet"
                contentEditable
                suppressContentEditableWarning
                key={x}
              >
                ✦ {x}
              </div>
            ))}
            <div className="metrics">
              {s.metrics.map((m: any) => (
                <div key={m.label}>
                  <small>{m.label}</small>
                  <strong>{m.value}</strong>
                  <i>{m.source}</i>
                </div>
              ))}
            </div>
            <footer>
              <b>EVIDENCE & ASSUMPTIONS</b>
              <p>{s.sources.join(" · ")}</p>
              <p>{s.assumptions[0]}</p>
            </footer>
          </article>
          <aside className="ai">
            <Brain />
            <h3>AI Copilot</h3>
            {[
              "Improve this slide",
              "Make it more investor-focused",
              "Make it concise",
              "Rewrite for clarity",
              "Add supporting metrics",
              "Strengthen the narrative",
            ].map((x) => (
              <button key={x} onClick={() => improveSlide(x)}>
                {x}
              </button>
            ))}
            <div className="why">
              <WandSparkles size={14} />
              <b>Why this slide?</b>
              <p>
                Influenced by {Math.min(3, p.references.length)} comparable
                reference decks.
              </p>
            </div>
          </aside>
        </div>
        <section className="score-section">
          <Progress active={5} />
          <div className="score-heading">
            <div>
              <b>06 — PITCH SCORE</b>
              <h2>Investor readiness</h2>
              <p>
                Improve traction evidence and competitive differentiation before
                presenting to investors.
              </p>
            </div>
            <strong>
              {pitch.pitchScore}
              <small>/100</small>
            </strong>
          </div>
          <div className="export-card">
            <div>
              <b>07 — EXPORT</b>
              <h3>Ready to share your story?</h3>
            </div>
            <div>
              <button className="outline" onClick={exportPdf}>
                Export PDF
              </button>
              <button className="primary" onClick={exportPptx}>
                Export PPTX
              </button>
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth reg />} />
        <Route path="/dashboard" element={<Dash />} />
        <Route path="/new" element={<New />} />
        <Route path="/project/:id" element={<Project />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;

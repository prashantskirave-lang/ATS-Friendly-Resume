import React, { useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertCircle,
  BriefcaseBusiness,
  Check,
  Clipboard,
  Download,
  FileText,
  Printer,
  Sparkles,
  Upload,
} from "lucide-react";
import * as mammoth from "mammoth/mammoth.browser";
import "./styles.css";

const actionVerbs = [
  "managed",
  "developed",
  "improved",
  "coordinated",
  "implemented",
  "analyzed",
  "designed",
  "optimized",
  "led",
  "prepared",
  "monitored",
  "executed",
  "supported",
  "delivered",
  "maintained",
  "reduced",
  "increased",
  "created",
  "reviewed",
  "trained",
];

const stopWords = new Set(
  "a an and are as at be by for from has have in into is it its of on or our that the their this to using with will you your we work role job candidate experience years ability skills responsibilities requirements preferred plus strong excellent good within across".split(
    " ",
  ),
);

const defaultResume = `Prashant Kirave
Process Engineer
Email: your.email@example.com | Phone: +91 XXXXX XXXXX | Location: City, India | LinkedIn: linkedin.com/in/your-profile

PROFESSIONAL SUMMARY
Process engineering professional with experience in process calculations, equipment review, technical documentation, and plant operations support.

SKILLS
Process Engineering, HAZOP, PFD, P&ID, Material Balance, Energy Balance, Equipment Sizing, Process Safety, Microsoft Excel, Technical Reporting

EXPERIENCE
Process Engineer
Company Name | 2024 - Present
- Prepared technical reports and process documentation for plant engineering activities.
- Reviewed process equipment data and supported operational troubleshooting.
- Coordinated with cross-functional teams to complete engineering deliverables.

EDUCATION
B.Tech in Petrochemical Engineering
University Name | 2024`;

const defaultJob = `We are hiring a Graduate Engineer Trainee / Process Engineer. The candidate should have knowledge of process engineering, PFD, P&ID, heat and material balance, equipment sizing, process safety, HAZOP, technical documentation, Excel, plant operations, troubleshooting, and communication with cross-functional teams.`;

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#. ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(text) {
  return text
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractKeywords(jobText, resumeText) {
  const normalizedJob = normalize(jobText);
  const resume = normalize(resumeText);
  const words = normalizedJob.match(/\b[a-z][a-z0-9+#.]{2,}\b/g) || [];
  const counts = new Map();
  const addTerm = (term, score) => {
    const parts = term.split(" ");
    if (!term || parts.some((part) => stopWords.has(part))) return;
    if (parts.length > 1 && new Set(parts).size !== parts.length) return;
    counts.set(term, (counts.get(term) || 0) + score);
  };

  const segments = normalizedJob
    .split(/\b(?:and|or|with|for|to|of|in|the|a|an|should|have|we|are|is|will)\b|[,.;:()/-]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  segments.forEach((segment) => {
    const segmentWords = segment
      .split(" ")
      .filter((word) => word.length > 2 && !stopWords.has(word));
    for (let size = Math.min(3, segmentWords.length); size >= 2; size -= 1) {
      for (let index = 0; index <= segmentWords.length - size; index += 1) {
        addTerm(segmentWords.slice(index, index + size).join(" "), size * 3);
      }
    }
  });

  words.forEach((word) => {
    if (!stopWords.has(word)) addTerm(word, 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 30)
    .map(([term]) => ({
      term: titleCase(term),
      matched: resume.includes(term),
    }));
}

function parseResume(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const name = lines[0] || "Your Name";
  const title = lines[1] && lines[1].length < 70 ? lines[1] : "Target Role";
  const contactLine =
    lines.find((line) => /@|\+?\d{7,}|linkedin|location/i.test(line)) ||
    "Email | Phone | City, Country | LinkedIn";
  const skillLine =
    lines.find((line) => /skill|pfd|p&id|excel|python|safety|engineering|analysis/i.test(line)) || "";
  const bullets = lines
    .filter((line) => /^[-*•]/.test(line) || actionVerbs.some((verb) => line.toLowerCase().startsWith(verb)))
    .map((line) => line.replace(/^[-*•]\s*/, ""))
    .slice(0, 8);
  const educationIndex = lines.findIndex((line) => /education|b\.?tech|degree|university|college/i.test(line));

  return {
    name,
    title,
    contactLine,
    skills: skillLine
      .replace(/skills?:?/i, "")
      .split(/,|;|\|/)
      .map((skill) => skill.trim())
      .filter(Boolean),
    bullets,
    education: educationIndex >= 0 ? lines.slice(educationIndex, educationIndex + 3).join(" | ") : "Degree / Certification | Institute | Year",
  };
}

function sentenceFromKeywords(keywords, fallback) {
  const selected = keywords
    .filter((keyword) => !keyword.matched)
    .slice(0, 5)
    .map((keyword) => keyword.term);
  return selected.length ? selected.join(", ") : fallback;
}

function buildResume(oldResume, jobText, targetPages) {
  const parsed = parseResume(oldResume);
  const keywords = extractKeywords(jobText, oldResume);
  const roleLine = jobText.match(/(?:hiring|role|position|title)\s*(?:a|an|for|:)?\s*([A-Za-z /\-]{4,60})/i)?.[1]?.trim();
  const targetTitle = roleLine ? titleCase(roleLine) : parsed.title;
  const topKeywords = keywords.slice(0, targetPages === "one" ? 10 : 16).map((keyword) => keyword.term);
  const missingKeywordText = sentenceFromKeywords(keywords, "process improvement, documentation, cross-functional collaboration");
  const skills = [...new Set([...topKeywords, ...parsed.skills])].slice(0, targetPages === "one" ? 18 : 26);
  const bullets = [
    `Analyzed job requirements and aligned process, technical, and operational experience with ${missingKeywordText}.`,
    `Prepared accurate documentation, reports, and engineering inputs while maintaining ATS-friendly keyword consistency.`,
    `Coordinated with cross-functional stakeholders to support timely delivery of engineering and operational priorities.`,
    `Improved workflow clarity by translating technical information into structured, measurable resume achievements.`,
    ...parsed.bullets.map((bullet) => enhanceBullet(bullet, topKeywords)),
  ].slice(0, targetPages === "one" ? 6 : 10);

  const summary =
    `${targetTitle} candidate with experience in ${skills.slice(0, 6).join(", ")} and technical documentation aligned to the target job description.`;

  return `${parsed.name}
${targetTitle}
${parsed.contactLine}

TARGET PROFILE
${summary}

PROFESSIONAL EXPERIENCE
${parsed.title}
Company Name | Dates
${bullets.map((bullet) => `- ${bullet}`).join("\n")}

TECHNICAL SKILLS
${skills.join(" | ")}

EDUCATION
${parsed.education}

${targetPages === "two" ? `PROJECTS / ADDITIONAL EXPERIENCE
- Applied ${skills.slice(0, 4).join(", ")} to solve technical problems and prepare structured deliverables.
- Used analytical thinking, documentation discipline, and communication skills to support practical engineering outcomes.

ATS KEYWORD ALIGNMENT
${topKeywords.join(" | ")}
` : ""}`.trim();
}

function enhanceBullet(bullet, keywords) {
  const clean = bullet.replace(/\.$/, "");
  const keyword = keywords.find((term) => !normalize(clean).includes(normalize(term)));
  const verb = actionVerbs.find((item) => normalize(clean).startsWith(item)) || "Delivered";
  const base = actionVerbs.includes(normalize(clean).split(" ")[0]) ? clean : `${verb} ${clean.charAt(0).toLowerCase()}${clean.slice(1)}`;
  return keyword ? `${base}, strengthening relevance to ${keyword}.` : `${base}.`;
}

function scoreResume(resumeText, keywords) {
  if (!resumeText.trim()) return 0;
  const matchRate = keywords.length ? keywords.filter((keyword) => keyword.matched).length / keywords.length : 0;
  const hasSections = ["summary", "skills", "experience", "education"].filter((section) => normalize(resumeText).includes(section)).length / 4;
  const lengthScore = Math.min(1, resumeText.split(/\s+/).length / 450);
  return Math.round((matchRate * 55 + hasSections * 30 + lengthScore * 15) || 0);
}

function renderFormattedResume(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return <div className="empty-preview">Generate a resume to see the ATS-friendly format.</div>;
  }

  const header = lines.slice(0, 3);
  const body = lines.slice(3);
  const sectionNames = new Set([
    "TARGET PROFILE",
    "PROFESSIONAL SUMMARY",
    "CORE SKILLS",
    "TECHNICAL SKILLS",
    "PROFESSIONAL EXPERIENCE",
    "PROJECTS / ADDITIONAL EXPERIENCE",
    "ATS KEYWORD ALIGNMENT",
    "EDUCATION",
  ]);

  return (
    <article className="resume-paper">
      <header className="resume-header">
        <h3>{header[0]}</h3>
        <p className="resume-title">{header[1]}</p>
        <p className="resume-contact">{header[2]}</p>
      </header>
      <div className="resume-divider" />
      <div className="resume-body">
        {body.map((line, index) => {
          if (sectionNames.has(line.toUpperCase())) {
            return (
              <React.Fragment key={`${line}-${index}`}>
                {index > 0 && <div className="resume-divider" />}
                <h4>{line}</h4>
              </React.Fragment>
            );
          }
          if (line.startsWith("-")) {
            return <p className="resume-bullet" key={`${line}-${index}`}>{line.replace(/^-\s*/, "")}</p>;
          }
          if (line.includes("|") && line.length < 120) {
            return <p className="resume-compact-line" key={`${line}-${index}`}>{line}</p>;
          }
          return <p key={`${line}-${index}`}>{line}</p>;
        })}
      </div>
    </article>
  );
}

async function extractFileText(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "docx") {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  }
  if (ext === "pdf") {
    const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str).join(" "));
    }
    return pages.join("\n");
  }
  return file.text();
}

function App() {
  const [oldResume, setOldResume] = useState(defaultResume);
  const [jobDescription, setJobDescription] = useState(defaultJob);
  const [targetPages, setTargetPages] = useState("one");
  const [generatedResume, setGeneratedResume] = useState("");
  const [status, setStatus] = useState("");
  const resumeRef = useRef(null);

  const keywords = useMemo(() => extractKeywords(jobDescription, generatedResume || oldResume), [jobDescription, generatedResume, oldResume]);
  const score = useMemo(() => scoreResume(generatedResume || oldResume, keywords), [generatedResume, oldResume, keywords]);
  const matched = keywords.filter((keyword) => keyword.matched).length;

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus(`Reading ${file.name}...`);
    try {
      const text = await extractFileText(file);
      setOldResume(text.trim());
      setStatus("Resume imported successfully.");
    } catch (error) {
      setStatus("Could not read that file. Try a DOCX, PDF, or TXT file.");
    }
  };

  const generate = () => {
    const resume = buildResume(oldResume, jobDescription, targetPages);
    setGeneratedResume(resume);
    setStatus("New ATS-friendly resume drafted. Review and edit before sending.");
  };

  const copyResume = async () => {
    await navigator.clipboard.writeText(generatedResume);
    setStatus("Resume copied to clipboard.");
  };

  const downloadTxt = () => {
    const blob = new Blob([generatedResume], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tailored-ats-resume.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const printResume = () => window.print();

  return (
    <main className="app-shell">
      <section className="workspace">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">
              <Sparkles size={22} />
            </div>
            <div>
              <h1>ATS Resume Tailor</h1>
              <p>Build a targeted 1-2 page resume from your old resume and job description.</p>
            </div>
          </div>

          <div className="score-card">
            <span>ATS readiness</span>
            <strong>{score}%</strong>
            <div className="meter">
              <div style={{ width: `${score}%` }} />
            </div>
            <p>{matched} of {keywords.length || 0} important keywords currently matched.</p>
          </div>

          <div className="keyword-panel">
            <h2>Job Keywords</h2>
            <div className="chips">
              {keywords.slice(0, 18).map((keyword) => (
                <span className={keyword.matched ? "chip matched" : "chip"} key={keyword.term}>
                  {keyword.matched ? <Check size={13} /> : <AlertCircle size={13} />}
                  {keyword.term}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <section className="editor-area">
          <div className="toolbar">
            <label className="upload-button">
              <Upload size={18} />
              Upload resume
              <input accept=".txt,.docx,.pdf" onChange={handleFile} type="file" />
            </label>
            <div className="segmented">
              <button className={targetPages === "one" ? "active" : ""} onClick={() => setTargetPages("one")}>1 page</button>
              <button className={targetPages === "two" ? "active" : ""} onClick={() => setTargetPages("two")}>2 pages</button>
            </div>
            <button className="primary" onClick={generate}>
              <Sparkles size={18} />
              Generate resume
            </button>
          </div>

          <div className="input-grid">
            <label className="field">
              <span><FileText size={17} /> Old Resume</span>
              <textarea value={oldResume} onChange={(event) => setOldResume(event.target.value)} />
            </label>
            <label className="field">
              <span><BriefcaseBusiness size={17} /> Job Description</span>
              <textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} />
            </label>
          </div>

          <section className="output-panel">
            <div className="output-head">
              <div>
                <h2>Final Resume</h2>
                <p>{status || "Paste your details, then generate a tailored ATS-friendly draft."}</p>
              </div>
              <div className="actions">
                <button disabled={!generatedResume} onClick={copyResume} title="Copy resume">
                  <Clipboard size={17} />
                </button>
                <button disabled={!generatedResume} onClick={downloadTxt} title="Download text">
                  <Download size={17} />
                </button>
                <button disabled={!generatedResume} onClick={printResume} title="Save as PDF">
                  PDF
                </button>
                <button disabled={!generatedResume} onClick={printResume} title="Print">
                  <Printer size={17} />
                </button>
              </div>
            </div>
            <textarea
              ref={resumeRef}
              className="resume-output"
              value={generatedResume}
              onChange={(event) => setGeneratedResume(event.target.value)}
              placeholder="Your generated resume will appear here and remain editable."
            />
            <div className="preview-wrap">
              {renderFormattedResume(generatedResume)}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);

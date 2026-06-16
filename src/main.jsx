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

const defaultResume = `Prashant Sambhaji Kirave (Aspen Certified User)
Process Engineer | Process Design Engineer | Relief Systems
Thane, Maharashtra, India | prashants.kirave@gmail.com | (+91) 9604111655 | linkedin.com/in/prashant-kirave

PROFESSIONAL SUMMARY
Process engineering professional with 2 years of experience in process calculations, equipment sizing, relief valve sizing (API 520/521/526), and plant operations support. Skilled in utilizing Aspen HYSYS, Aspen Plus, and AutoCAD to prepare process deliverables (PFDs, P&IDs, Heat & Material Balances) for cross-functional EPC teams.

Process Engineer – Professional Experience (2 years)
Process Engineer - ProWoo Engineering Solutions Pvt. LTD. | June 2024 - Present
Project: Vapour Recovery Unit (VRU), BASF.
- Prepared P&IDs, PFD, line list, and valve list for process systems.
- Extracted Heat & Material Balance (H&MB) data from simulation models.
- Participated in 3D model review using Navisworks to verify equipment layout and piping design.
- Supported engineering documentation and design coordination.
Project: Amine Sweetening Unit (ASU), Coolsorption.
- Developed process simulation model using Aspen HYSYS for an amine gas sweetening unit.
- Prepared PFDs and P&IDs from scratch for the process unit.
- Performed line sizing, line list preparation, valve sizing, valve list preparation, and H&MB extraction.
Project: Fuel Gas Skid, STECH.
- Developed process simulation model using Aspen HYSYS for Fuel Gas Skid, & Prepared H&MB.
- Prepared PFD and P&ID from scratch for the Fuel Gas Skid.
Project: Relief Valve Sizing, CXO LYONDELLBASEL & Kinder Morgan
- Conducted pressure safety valve (PSV) sizing using PSPPM software.
- Supported relief system analysis for safe equipment operation.
Project: Gas Dew Pointing Unit Simulation & Process Design (Aspen HYSYS), KPCL
- Simulated a Gas Dew Pointing Unit in Aspen HYSYS, including compressor skids (A & B), regeneration system, and the lube oil circuit.
- Developed detailed Heat & Material Balance (H&MB) for the complete process under multiple operating scenarios.

Research Experience – Indian Institute of Technology, Bombay. (10 months)
- Performed CFD simulations of two-phase flow dynamics using Basilisk to study wave-breaking phenomena.
- Used MATLAB for numerical analysis and ParaView for simulation data visualisation.
- Developed strong skills in CFD modelling, numerical methods, and scientific data analysis under the guidance of Prof. Ratul Dasgupta.

Academic Projects
Project Name: Design and Simulation of a Stabiliser Column for Oil Handling Train

Certified course:
- Aspen HYSYS Certified User | Advanced Process Engineering – Viggyantech Pvt. Ltd., Thane

Technical Skills
Process Simulation: Aspen HYSYS, Aspen Plus, Aspen FlareNet
Process Safety: PSV sizing (API 520/521/526), API RP 14E, Relief load calculations, Flare system design, Emergency depressurisation analysis
Engineering Software: PSPPM, IPRISM, Basilisk, ParaView, Navisworks, AutoCAD
Engineering Documentation: PFD & P&ID development, Line sizing, Line list & valve list, Equipment datasheets, H&MB extraction

EDUCATION
B. Tech. in Petrochemical Engineering at Dr. Babasaheb Ambedkar Technological University, Lonere. | 2020-2024 (7.8 CGPA)`;

const defaultJob = `We are looking for a Process Engineer / Process Design Engineer with 2+ years of experience in Process Simulation and Relief Systems. 
Key requirements:
- Proficiency in Aspen HYSYS, Aspen Plus, and Aspen FlareNet.
- Experience with Process Safety including PSV sizing, API 520/521/526, and relief load calculations.
- Experience developing PFDs, P&IDs, Line sizing, and H&MB extraction.
- Knowledge of engineering software such as PSPPM, IPRISM, and AutoCAD.
- Strong technical documentation and cross-functional coordination skills.`;

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
    "Thane, Maharashtra, India | prashants.kirave@gmail.com | (+91) 9604111655 | linkedin.com/in/prashant-kirave";

  const bullets = lines
    .filter((line) => line.startsWith("-") || line.startsWith("•") || line.startsWith("*"))
    .map((line) => line.replace(/^[-*•]\s*/, ""))
    .slice(0, 15);

  const skills = [];
  const knownSkills = ["Aspen HYSYS", "Aspen Plus", "Aspen FlareNet", "PSV sizing", "HAZOP", "PFD", "P&ID", "Material Balance", "Energy Balance", "Equipment Sizing", "Process Safety", "Excel", "Technical Reporting", "CFD", "Basilisk", "ParaView", "Navisworks", "AutoCAD", "MATLAB", "Relief load calculations", "Flare system design", "Emergency depressurisation analysis", "IPRISM", "PSPPM", "Line sizing"];
  const textLower = rawText.toLowerCase();
  knownSkills.forEach(skill => {
    if (textLower.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  });

  const eduLine = lines.find(line => /b\.?\s*tech|education|degree|university|college/i.test(line)) || "";
  let education = eduLine;
  if (eduLine) {
    const idx = lines.indexOf(eduLine);
    if (idx !== -1 && lines[idx+1] && !lines[idx+1].startsWith("-") && lines[idx+1].length > 10) {
      education = lines.slice(idx, idx+2).join(" | ");
    }
  }

  return {
    name,
    title,
    contactLine,
    skills: [...new Set(skills)],
    bullets,
    education: education || "B. Tech. in Petrochemical Engineering at Dr. Babasaheb Ambedkar Technological University, Lonere. | 2020-2024 (7.8 CGPA)"
  };
}

function calculateTotalExperience(resumeText) {
  let totalMonths = 0;
  const lines = resumeText.split(/\r?\n/);
  
  // Filter out lines that are not headers to avoid matching descriptive sentences
  const linesWithExperience = lines.filter(line => {
    const hasExperience = /experience/i.test(line);
    const isHeading = line.length < 100 && !/with\s+\d+\s+years\s+of\s+experience/i.test(line) && !/working/i.test(line);
    return hasExperience && isHeading;
  });
  
  const lineMatches = [];

  for (const line of linesWithExperience) {
    // Look for parenthesized numbers first
    const matches = line.matchAll(/\((\d+(?:\.\d+)?)\s*(year|month|yr|mth)s?\)/gi);
    for (const match of matches) {
      const val = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      lineMatches.push({ val, unit });
    }
  }

  // Fallback: if no parenthesized matches in headings, look for unparenthesized numbers in those headings
  if (lineMatches.length === 0) {
    for (const line of linesWithExperience) {
      const matches = line.matchAll(/(\d+(?:\.\d+)?)\s*(year|month|yr|mth)s?/gi);
      for (const match of matches) {
        const val = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        lineMatches.push({ val, unit });
      }
    }
  }

  lineMatches.forEach(({ val, unit }) => {
    if (unit.startsWith("y")) {
      totalMonths += val * 12;
    } else if (unit.startsWith("m")) {
      totalMonths += val;
    }
  });

  if (totalMonths === 0) {
    return "2 years and 10 months";
  }

  const years = Math.floor(totalMonths / 12);
  const months = Math.round(totalMonths % 12);

  if (years > 0 && months > 0) {
    return `${years} year${years > 1 ? "s" : ""} and ${months} month${months > 1 ? "s" : ""}`;
  } else if (years > 0) {
    return `${years} year${years > 1 ? "s" : ""}`;
  } else {
    return `${months} month${months > 1 ? "s" : ""}`;
  }
}

function parseSections(text) {
  const lines = text.split(/\r?\n/);
  const sections = {
    header: [],
    summary: [],
    experience: [],
    research: [],
    projects: [],
    courses: [],
    skills: [],
    education: []
  };

  let currentSection = "header";

  for (let line of lines) {
    let trimmed = line.trim();
    if (!trimmed) continue;

    // Clean up any legacy AI keyword suffixes like ", strengthening relevance to..."
    trimmed = trimmed.replace(/,?\s*strengthening relevance to[^.]*(\.|$)/gi, "$1").trim();
    if (!trimmed) continue;

    const upper = trimmed.toUpperCase();
    
    if (upper === "PROFESSIONAL SUMMARY") {
      currentSection = "summary";
      continue;
    } else if (upper.startsWith("PROCESS ENGINEER – PROFESSIONAL EXPERIENCE") || upper.startsWith("PROFESSIONAL EXPERIENCE") || (upper.includes("PROFESSIONAL EXPERIENCE") && upper.length < 80)) {
      currentSection = "experience";
      continue;
    } else if (upper.startsWith("RESEARCH EXPERIENCE") && upper.length < 80) {
      currentSection = "research";
      continue;
    } else if (upper === "ACADEMIC PROJECTS" || upper === "PROJECTS") {
      currentSection = "projects";
      continue;
    } else if (upper.startsWith("CERTIFIED COURSE") || (upper.includes("CERTIFIED COURSE") && upper.length < 80)) {
      currentSection = "courses";
      continue;
    } else if (upper === "TECHNICAL SKILLS" || upper === "SKILLS") {
      currentSection = "skills";
      continue;
    } else if (upper === "EDUCATION") {
      currentSection = "education";
      continue;
    }

    sections[currentSection].push(trimmed);
  }

  return sections;
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
  const sections = parseSections(oldResume);
  
  // Sort parsed.skills to prioritize those mentioned in the job description
  const matchedSkills = parsed.skills.filter(s => 
    normalize(jobText).includes(normalize(s))
  );
  const unmatchedSkills = parsed.skills.filter(s => 
    !normalize(jobText).includes(normalize(s))
  );
  const skillsList = [...matchedSkills, ...unmatchedSkills];
  
  const processSimulation = skillsList.filter(s => /hysys|aspen|flarenet|simulation|model/i.test(s)).slice(0, 4).join(", ") || "Aspen HYSYS, Aspen Plus, Aspen FlareNet";
  const processSafety = skillsList.filter(s => /safety|psv|sizing|hazop|relief|api/i.test(s)).slice(0, 5).join(", ") || "PSV sizing (API 520/521/526), API RP 14E, Relief load calculations, Flare system design, Emergency depressurisation analysis";
  const engineeringSoftware = skillsList.filter(s => /software|sppm|prism|basilisk|paraview|navisworks|autocad|excel/i.test(s)).slice(0, 6).join(", ") || "PSPPM, IPRISM, Basilisk, ParaView, Navisworks, AutoCAD";
  const engineeringDoc = skillsList.filter(s => /doc|pfd|p&id|sizing|list|datasheets|h&mb/i.test(s)).slice(0, 5).join(", ") || "PFD & P&ID development, Line sizing, Line list & valve list, H&MB extraction";

  const totalExp = calculateTotalExperience(oldResume);
  const summaryText = `Detail-oriented and results-driven Process Engineer with ${totalExp} of hands-on experience in process design, simulation, and safety system calculations for Oil & Gas EPC projects. Proficient in key industry standards (API 520/521/526) and specialized tools including ${skillsList.slice(0, 5).join(", ")}. Proven track record in preparing PFDs/P&IDs, performing relief load calculations, and collaborating with cross-functional teams to deliver high-quality engineering packages.`;

  const roleLine = jobText.match(/(?:hiring|role|position|title)\s*(?:a|an|for|:)?\s*([A-Za-z /\-]{4,60})/i)?.[1]?.trim();
  const targetTitle = roleLine ? titleCase(roleLine) : parsed.title;

  const nameLine = sections.header[0] || parsed.name;
  const contactLine = sections.header[2] || parsed.contactLine;

  const resultLines = [
    nameLine,
    targetTitle,
    contactLine,
    "",
    "PROFESSIONAL SUMMARY",
    summaryText,
    "",
    "Process Engineer – Professional Experience (2 years)",
    ...sections.experience,
    "",
    "Research Experience – Indian Institute of Technology, Bombay. (10 months)",
    ...sections.research,
    "",
    "Academic Projects",
    ...sections.projects,
    "",
    "Certified course:",
    ...sections.courses,
    "",
    "Technical Skills",
    `Process Simulation: ${processSimulation}`,
    `Process Safety: ${processSafety}`,
    `Engineering Software: ${engineeringSoftware}`,
    `Engineering Documentation: ${engineeringDoc}`,
    "",
    "EDUCATION",
    ...sections.education
  ];

  return resultLines.join("\n").trim();
}

function isActionVerb(word) {
  const normalized = word.toLowerCase();
  return (
    actionVerbs.includes(normalized) ||
    normalized.endsWith("ed") ||
    /^(built|led|wrote|ran|held|sold|met|set|cut|cost|spent|won|lost|blew|drew|grew|flew|rose|fell|sold|sent|told|kept|read|slept|took|gave|came|went|saw|made|found|got|thought|told|shook|stood|understood|paid)$/.test(normalized)
  );
}

function enhanceBullet(bullet, keywords) {
  const clean = bullet.replace(/\.$/, "").trim();
  const firstWord = normalize(clean).split(" ")[0];
  const verb = actionVerbs.find((item) => normalize(clean).startsWith(item)) || "Delivered";
  const base = isActionVerb(firstWord) ? clean : `${verb} ${clean.charAt(0).toLowerCase()}${clean.slice(1)}`;
  return `${base}.`;
}

function scoreResume(resumeText, keywords) {
  if (!resumeText.trim()) return 0;
  const matchRate = keywords.length ? keywords.filter((keyword) => keyword.matched).length / keywords.length : 0;
  const hasSections = ["skills", "experience", "education"].filter((section) => normalize(resumeText).includes(section)).length / 3;
  const lengthScore = Math.min(1, resumeText.split(/\s+/).length / 450);
  return Math.round((matchRate * 55 + hasSections * 30 + lengthScore * 15) || 0);
}

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="#0077b5" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const renderTextWithBold = (text) => {
  if (!text) return "";
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const renderContactLine = (line) => {
  if (!line) return null;
  const parts = line.split(/\||•/).map((p) => p.trim()).filter(Boolean);
  const emailPart = parts.find((p) => p.includes("@"));
  const linkedinPart = parts.find((p) => p.includes("linkedin.com"));
  const phonePart = parts.find((p) => /\+?\d{7,}/.test(p) || /\+?\d[\d\s-]{5,}\d/.test(p));
  const locationPart = parts.find((p) => p !== emailPart && p !== linkedinPart && p !== phonePart);

  const items = [];
  if (locationPart) {
    items.push(<span key="loc">•  {locationPart}</span>);
  }
  if (emailPart) {
    items.push(
      <a key="email" href={`mailto:${emailPart}`} className="resume-link" target="_blank" rel="noopener noreferrer">
        {emailPart}
      </a>
    );
  }
  if (phonePart) {
    items.push(<span key="phone">{phonePart}</span>);
  }
  if (linkedinPart) {
    items.push(
      <span key="li" className="linkedin-wrapper" style={{ display: "inline-flex", alignItems: "center" }}>
        <a href={linkedinPart.startsWith("http") ? linkedinPart : `https://${linkedinPart}`} target="_blank" rel="noopener noreferrer" title="LinkedIn Profile" style={{ position: "relative", display: "inline-flex", alignItems: "center", textDecoration: "none", width: "13px", height: "13px" }}>
          <LinkedInIcon />
          <span style={{ position: "absolute", inset: 0, color: "transparent", fontSize: "12px", overflow: "hidden", whiteSpace: "nowrap" }}>LinkedIn</span>
        </a>
      </span>
    );
  }

  const listElements = [];
  items.forEach((item, index) => {
    listElements.push(item);
    if (index < items.length - 1) {
      listElements.push(<span key={`bullet-${index}`} className="resume-contact-bullet">•</span>);
    }
  });

  return (
    <div className="resume-contact-container">
      {listElements}
    </div>
  );
};

function renderFormattedResume(text, targetPages) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return <div className="empty-preview">Generate a resume to see the ATS-friendly format.</div>;
  }

  const header = lines.slice(0, 3);
  const body = lines.slice(3);

  const isHeader = (line) => {
    const upper = line.toUpperCase();
    return (
      upper === "EDUCATION" ||
      upper === "TECHNICAL SKILLS" ||
      upper === "ACADEMIC PROJECTS" ||
      upper.startsWith("PROCESS ENGINEER") ||
      upper.startsWith("RESEARCH EXPERIENCE") ||
      upper.startsWith("CERTIFIED COURSE") ||
      upper === "TARGET PROFILE" ||
      upper === "PROFESSIONAL SUMMARY" ||
      upper === "CORE SKILLS" ||
      upper === "ATS KEYWORD ALIGNMENT"
    );
  };

  let currentSection = "";

  return (
    <article className={`resume-paper ${targetPages === "one" ? "single-page" : ""}`}>
      <header className="resume-header">
        <h3>{header[0]}</h3>
        {header[1] && <p className="resume-title">{header[1]}</p>}
        {header[2] && renderContactLine(header[2])}
      </header>
      <div className="resume-body">
        {body.map((line, index) => {
          if (isHeader(line)) {
            currentSection = line.toUpperCase();
            return (
              <React.Fragment key={`${line}-${index}`}>
                <div className="resume-divider" />
                <h4>{line}</h4>
              </React.Fragment>
            );
          }
          if (line.startsWith("Project:") || line.startsWith("Project Name:")) {
            return (
              <h5 className="resume-project-title" key={`${line}-${index}`}>
                {renderTextWithBold(line)}
              </h5>
            );
          }
          if (line.startsWith("-")) {
            return (
              <p className="resume-bullet" key={`${line}-${index}`}>
                {renderTextWithBold(line.replace(/^-\s*/, ""))}
              </p>
            );
          }
          const colonMatch = line.match(/^([^:]+): (.*)$/);
          if (colonMatch && colonMatch[1].length < 35) {
            return (
              <p className="resume-key-value" key={`${line}-${index}`}>
                <strong>{colonMatch[1]}:</strong> {renderTextWithBold(colonMatch[2])}
              </p>
            );
          }
          if (line.includes("|") && line.length < 120) {
            const isEdu = currentSection.startsWith("EDUCATION");
            return (
              <p className={isEdu ? "resume-education-line" : "resume-compact-line"} key={`${line}-${index}`}>
                {renderTextWithBold(line)}
              </p>
            );
          }
          const isEdu = currentSection.startsWith("EDUCATION");
          return (
            <p className={isEdu ? "resume-education-line" : ""} key={`${line}-${index}`}>
              {renderTextWithBold(line)}
            </p>
          );
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
      const textItems = content.items.filter((item) => item.transform);
      const sortedItems = textItems.sort((a, b) => {
        const yA = a.transform[5];
        const yB = b.transform[5];
        const xA = a.transform[4];
        const xB = b.transform[4];
        if (Math.abs(yA - yB) < 5) {
          return xA - xB;
        }
        return yB - yA;
      });
      let pageText = "";
      let lastY = null;
      for (const item of sortedItems) {
        const y = item.transform[5];
        if (lastY !== null && Math.abs(lastY - y) > 5) {
          pageText += "\n";
        } else if (pageText.length > 0 && !pageText.endsWith(" ") && !item.str.startsWith(" ")) {
          pageText += " ";
        }
        pageText += item.str;
        lastY = y;
      }
      pages.push(pageText);
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
    event.target.value = "";
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
              {renderFormattedResume(generatedResume, targetPages)}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);

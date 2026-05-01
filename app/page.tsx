"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import profileData from "../data/profile-data.json";

gsap.registerPlugin(ScrollTrigger);

const capabilities = [
  {
    title: "Agentic RAG",
    copy: "Autonomous agents that plan, retrieve, reason, and resolve across grounded context paths.",
    tech: ["PY", "RAG", "SEA", "FN"],
    type: "orbit"
  },
  {
    title: "Multimodal AI",
    copy: "Text, vision, audio, and structured data pipelines shaped into coherent user-facing systems.",
    tech: ["CV", "TTS", "LLM", "AI"],
    type: "stack"
  },
  {
    title: "Backend Architecture",
    copy: "Observable services designed around explicit contracts, reliability, and secure persistence.",
    tech: ["API", "TS", "JS", "DB"],
    type: "service"
  },
  {
    title: "Cloud-Native Systems",
    copy: "Containerized delivery, CI/CD discipline, cloud operations, and recovery-aware execution.",
    tech: ["DKR", "GCP", "CI", "CF"],
    type: "cloud"
  }
];

const accordions = [
  ["AI and Models", "Gemini API, Vertex AI, SEA-LION, RAG, function calling, LLM orchestration, TTS and STT"],
  ["Backend", "Node.js, Express.js, TypeScript, Python, RESTful APIs, event-driven service boundaries"],
  ["Interface", "React, Next.js, canvas-driven interaction models, HTML, CSS, responsive systems"],
  ["Cloud and DevOps", "Docker, GitHub Actions, Google Cloud, Cloudflare, CI/CD, observability"]
];

const liveData = profileData as {
  metrics: {
    publicRepos: number;
    followers: number;
    totalStars: number;
    totalForks: number;
    contributionTotal: number;
    contributionSource: string;
  };
  languages: Array<{ label: string; value: number }>;
  activity: Array<{ label: string; value: string }>;
  contributionLevels: number[];
  generatedAt: string;
};

const languages = liveData.languages.length ? liveData.languages : [{ label: "TypeScript", value: 100 }];

const metrics = [
  ["Public repos", String(liveData.metrics.publicRepos)],
  ["Followers", String(liveData.metrics.followers)],
  ["Total stars", String(liveData.metrics.totalStars)],
  ["Total forks", String(liveData.metrics.totalForks)]
];

function words(text: string) {
  return text.split(" ").map((word, index) => (
    <span className="word" key={`${word}-${index}`}>
      {word}{" "}
    </span>
  ));
}

function Diagram({ type }: { type: string }) {
  if (type === "orbit") {
    return (
      <svg className="mini-diagram" viewBox="0 0 260 174" aria-hidden="true">
        <circle cx="130" cy="87" r="18" fill="#67e8f9" opacity="0.32" />
        <circle cx="130" cy="87" r="54" stroke="#67e8f9" opacity="0.38" />
        <circle cx="130" cy="87" r="78" stroke="#67e8f9" opacity="0.16" />
        {[
          [130, 24, "Query"],
          [205, 86, "Retrieve"],
          [162, 146, "Reason"],
          [72, 132, "Act"],
          [54, 62, "Plan"]
        ].map(([x, y, label]) => (
          <g key={String(label)}>
            <line x1="130" y1="87" x2={Number(x)} y2={Number(y)} stroke="#67e8f9" opacity="0.28" />
            <rect x={Number(x) - 28} y={Number(y) - 12} width="56" height="24" rx="12" fill="#0a1017" stroke="#67e8f9" opacity="0.86" />
            <text x={Number(x)} y={Number(y) + 4} textAnchor="middle" fill="#d9faff" fontSize="9">{label}</text>
          </g>
        ))}
      </svg>
    );
  }

  if (type === "stack") {
    return (
      <svg className="mini-diagram" viewBox="0 0 260 174" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <g key={item} transform={`translate(${62 + item * 20} ${28 + item * 22})`}>
            <path d="M0 28L62 0L124 28L62 56Z" fill="#223442" stroke="#67e8f9" opacity={0.72 - item * 0.1} />
            <path d="M0 28V43L62 72L124 43V28L62 56Z" fill="#10202a" stroke="#67e8f9" opacity="0.38" />
          </g>
        ))}
      </svg>
    );
  }

  if (type === "service") {
    return (
      <svg className="mini-diagram" viewBox="0 0 260 174" aria-hidden="true">
        <rect x="54" y="22" width="152" height="34" rx="4" fill="#0a1017" stroke="#67e8f9" />
        <text x="130" y="43" textAnchor="middle" fill="#dffaff" fontSize="10">API gateway</text>
        {[42, 102, 162].map((x) => (
          <g key={x}>
            <path d={`M130 56V78H${x + 28}V96`} stroke="#67e8f9" opacity="0.5" />
            <rect x={x} y="96" width="56" height="28" rx="4" fill="#0a1017" stroke="#67e8f9" opacity="0.72" />
          </g>
        ))}
        {[56, 118, 180].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="148" rx="16" ry="6" fill="#0a1017" stroke="#e6edf3" />
            <path d={`M${x - 16} 148V160C${x - 8} 168 ${x + 8} 168 ${x + 16} 160V148`} fill="#0a1017" stroke="#e6edf3" opacity="0.8" />
          </g>
        ))}
      </svg>
    );
  }

  return (
    <svg className="mini-diagram" viewBox="0 0 260 174" aria-hidden="true">
      <path d="M130 18L198 57V134L130 172L62 134V57Z" fill="#0d1922" stroke="#67e8f9" opacity="0.62" />
      <path d="M130 48L170 72V119L130 143L90 119V72Z" fill="#102531" stroke="#67e8f9" />
      <path d="M130 18V48M198 57L170 72M198 134L170 119M130 172V143M62 134L90 119M62 57L90 72" stroke="#67e8f9" opacity="0.5" />
      <text x="26" y="91" fill="#67e8f9" fontSize="10">deploy</text>
      <text x="196" y="91" fill="#67e8f9" fontSize="10">monitor</text>
      <text x="112" y="92" fill="#dffaff" fontSize="10">system</text>
    </svg>
  );
}

function TileField() {
  const levels = liveData.contributionLevels.length >= 180 ? liveData.contributionLevels.slice(-252) : Array.from({ length: 252 }, (_, index) => {
    const wave = Math.sin(index * 0.33) + Math.cos(index * 0.17);
    if (index > 116 && index < 204 && wave > -1.2) return 4;
    if (index > 72 && wave > -0.5) return 3;
    if (index % 5 === 0 || wave > 0.9) return 2;
    if (index % 3 === 0) return 1;
    return 0;
  });

  return (
    <div className="tile-field" aria-label="Contribution tile field">
      {levels.map((level, index) => (
        <span className="tile" data-level={level} key={index} />
      ))}
    </div>
  );
}

function SparkField() {
  return (
    <div className="spark-field" aria-hidden="true">
      {Array.from({ length: 96 }, (_, index) => (
        <span
          className="spark"
          key={index}
          style={{
            left: `${(index * 37) % 100}%`,
            top: `${(index * 19) % 100}%`,
            opacity: 0.22 + ((index % 7) / 12)
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const root = useRef<HTMLElement | null>(null);

  useGSAP(() => {
    gsap.fromTo(".hero .reveal", { y: 34, opacity: 0 }, {
      y: 0,
      opacity: 1,
      duration: 1.1,
      stagger: 0.08,
      ease: "power3.out"
    });

    gsap.to(".hero-bg", {
      scale: 1.08,
      opacity: 0.62,
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    gsap.fromTo(".capability-card", { y: 18 }, {
      y: 0,
      duration: 0.9,
      stagger: 0.05,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".capability-grid",
        start: "top 78%"
      }
    });
  }, { scope: root });

  return (
    <main className="atlas" ref={root}>
      <nav className="nav" aria-label="Profile navigation">
        <a className="brand" href="#top"><span className="brand-mark" />Khalfani Indrajaya</a>
        <div className="nav-links">
          <a href="#top">Atlas</a>
          <a href="#systems">Systems</a>
          <a href="#telemetry">Telemetry</a>
          <a href="#contact">Contact</a>
        </div>
        <a className="nav-cta" href="mailto:khalshaquille03@gmail.com">Contact</a>
      </nav>

      <header className="hero" id="top">
        <div className="hero-bg" />
        <div className="coordinate-rail"><span>6.8926 S</span><span>107.6101 E</span></div>
        <div className="hero-inner">
          <section className="reveal">
            <span className="eyebrow">Interstellar Atlas</span>
            <h1 className="hero-title">
              Architecting AI systems for <span className="inline-orbit" /> <span className="accent">orbit</span> and scale
            </h1>
            <p className="hero-copy">
              I design and build intelligent systems that reason, retrieve, orchestrate, and operate at scale across AI workflows, backend services, systems architecture, and cloud-native platforms.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#telemetry">View telemetry</a>
              <a className="button secondary" href="mailto:khalshaquille03@gmail.com">Contact</a>
            </div>
          </section>

          <aside className="hero-instrument reveal" aria-label="System alignment instrument">
            <div className="instrument-panel">
              <span className="panel-label">Aligning systems / causing impact</span>
              <svg className="constellation" viewBox="0 0 320 132" aria-hidden="true">
                <path d="M36 94L78 48L125 66L169 31L218 70L284 42" stroke="#67e8f9" strokeOpacity="0.72" />
                {[36, 78, 125, 169, 218, 284].map((x, index) => (
                  <circle key={x} cx={x} cy={[94, 48, 66, 31, 70, 42][index]} r="3" fill="#67e8f9" />
                ))}
                <path d="M78 48L169 31L284 42M125 66L218 70" stroke="#e6edf3" strokeOpacity="0.16" />
              </svg>
              {[
                ["Data", "99.7", "94%"],
                ["Models", "98.2", "88%"],
                ["Services", "99.5", "91%"],
                ["APIs", "99.8", "96%"]
              ].map(([label, value, width]) => (
                <div className="status-row" key={label}>
                  <span>{label}</span>
                  <div className="bar"><span style={{ width }} /></div>
                  <span>{value}%</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
        <div className="orbit-steps">
          <span>Observe</span><span>Ingest</span><span>Reason</span><span>Orchestrate</span><span>Deliver</span>
        </div>
      </header>

      <section className="section chapter" id="systems">
        <div className="section-head">
          <span className="section-kicker">Core capabilities</span>
          <span className="section-line">Systems that think. Platforms that scale.</span>
        </div>
        <div className="capability-grid">
          {capabilities.map((item) => (
            <article className="capability-card reveal" key={item.title}>
              <h3>{item.title}</h3>
              <Diagram type={item.type} />
              <p>{item.copy}</p>
              <div className="tech-line">
                {item.tech.map((tech) => <span key={tech}>{tech}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section narrative">
        <h2 className="reveal">
          I build systems that extend human intent and create compounding <span className="accent">impact.</span>
        </h2>
        <p className="scrub-copy reveal">
          {words("Technology should amplify capability, not complexity. I work at the intersection of models, data, and systems engineering to turn ideas into reliable products. From orchestrating intelligent agents to architecting robust backend services in the cloud, I focus on craft, clarity, and impact that scales.")}
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-kicker">Skill atlas</span>
          <span className="section-line">Systems I work with</span>
        </div>
        <div className="accordion">
          {accordions.map(([title, copy]) => (
            <div className="accordion-row reveal" key={title}>
              <h3>{title}</h3>
              <p><strong>{copy.split(",")[0]}</strong>{copy.includes(",") ? `,${copy.split(",").slice(1).join(",")}` : ""}</p>
              <span className="plus">+</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section tiles-section" id="telemetry">
        <div className="section-head">
          <span className="section-kicker">Contribution field</span>
          <span className="section-line">Last 12 months</span>
        </div>
        <div className="tile-wrap reveal">
          <TileField />
          <aside className="tile-counter">
            <span>Total contributions</span>
            <strong>{liveData.metrics.contributionTotal.toLocaleString("en-US")}</strong>
            <p>Source<br />{liveData.metrics.contributionSource}<br />Generated {liveData.generatedAt}</p>
          </aside>
        </div>
      </section>

      <section className="section chapter">
        <div className="section-head">
          <span className="section-kicker">Live telemetry</span>
          <span className="section-line">Public GitHub signal</span>
        </div>
        <div className="telemetry-grid">
          {metrics.map(([label, value]) => (
            <div className="metric reveal" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
          <div className="data-panel reveal">
            <span>Language mass</span>
            {languages.map((item) => (
              <div className="language-row" key={item.label}>
                <b>{item.label}</b>
                <div className="bar"><span style={{ width: `${item.value}%` }} /></div>
                <small>{item.value}%</small>
              </div>
            ))}
          </div>
          <div className="data-panel reveal">
            <span>Recent public activity</span>
            {liveData.activity.map((item) => (
              <div className="activity-row" key={item.label}>
                <b>{item.label}</b>
                <small>{item.value}</small>
              </div>
            ))}
          </div>
          <div className="data-panel reveal">
            <span>Code frequency</span>
            <SparkField />
          </div>
        </div>
      </section>

      <section className="section recognition">
        <div className="section-head">
          <span className="section-kicker">Recognition</span>
          <span className="section-line">Milestones that matter</span>
        </div>
        <div className="recognition-grid">
          <article className="award reveal">
            <h3>Most Innovative Use of SEA-LION Models</h3>
            <p>Pan-SEA AI Developer Challenge 2025</p>
          </article>
          <article className="award reveal">
            <h3>1st Place Software Development</h3>
            <p>IT Festival, IPB University 2025</p>
          </article>
        </div>
      </section>

      <section className="section contact" id="contact">
        <h2 className="reveal">Let us build what is next</h2>
        <div className="contact-links reveal">
          <a href="mailto:khalshaquille03@gmail.com"><span>Email</span><span>khalshaquille03@gmail.com</span></a>
          <a href="https://github.com/khalshaqzzy"><span>GitHub</span><span>github.com/khalshaqzzy</span></a>
          <a href="https://www.linkedin.com/in/khalfani-indrajaya"><span>LinkedIn</span><span>khalfani-indrajaya</span></a>
        </div>
      </section>

      <footer className="footer">
        <span>2026 Muhammad Khalfani Shaquille Indrajaya</span>
        <span>Design systems. Ship impact.</span>
        <span>6.8926 S / 107.6101 E</span>
      </footer>
    </main>
  );
}

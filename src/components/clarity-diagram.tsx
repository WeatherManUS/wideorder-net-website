"use client";
import { useEffect, useId, useRef, useState } from "react";
const stages = [
  { name: "Complexity", text: "Disconnected tasks. Repeated effort. Too much depends on a workaround." },
  { name: "Clarity", text: "Understand the connections. Find the constraint. Choose what matters." },
  { name: "Order", text: "A simpler flow. Clear responsibilities. Work that moves forward." },
];
const tasks = ["People", "Systems", "Processes", "Information", "Decisions", "Outcomes"];
const icons = [
  <g key="people"><circle cx="12" cy="7" r="3"/><path d="M6 21v-3a6 6 0 0 1 12 0v3M3 8v5M21 8v5"/></g>,
  <path key="systems" d="m12 3 10 5-10 5L2 8Zm-10 10 10 5 10-5M2 18l10 5 10-5"/>,
  <g key="processes"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3"/></g>,
  <path key="information" d="M5 2h10l4 4v16H5Zm4 6h6M9 12h6m-6 4h6"/>,
  <path key="decisions" d="M12 22V4m-4 4 4-4 4 4M12 17Q12 9 3 9m3-3L3 9l3 3M12 17q0-8 9-8m-3-3 3 3-3 3"/>,
  <g key="outcomes"><path d="M21 12a9 9 0 1 1-9-9m5 9a5 5 0 1 1-5-5m0 5L22 2m-5 0h5v5"/></g>,
];
export function ClarityDiagram() {
  const [stage, setStage] = useState(0);
  const id = useId();
  const surface = useRef<HTMLDivElement>(null);
  const interrupted = useRef(false);
  const played = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stop = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting) || played.current || interrupted.current || motion.matches) return;
      played.current = true;
      timers.current = [setTimeout(() => setStage(1), 1200), setTimeout(() => setStage(2), 2900)];
    }, { threshold: .35 });
    const preference = () => {
      if (motion.matches) { stop(); played.current = true; if (!interrupted.current) setStage(2); }
    };
    preference();
    if (surface.current) observer.observe(surface.current);
    motion.addEventListener("change", preference);
    return () => { stop(); observer.disconnect(); motion.removeEventListener("change", preference); };
  }, []);
  const select = (index: number) => { interrupted.current = true; stop(); setStage(index); };
  return <div className="clarity" ref={surface} data-stage={stage}>
    <div className="clarity__heading"><span>From friction to flow</span><span aria-hidden="true">0{stage + 1} / 03</span></div>
    <div className="clarity__canvas" role="img" aria-label={`${stages[stage].name}: People, Systems, Processes, Information, Decisions and Outcomes ${stage === 0 ? "are disconnected" : stage === 1 ? "are coming into alignment" : "form a coordinated operation"}.`}>
      <div className="clarity__frame" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span className="clarity__segment" key={index} style={{ "--piece": index } as React.CSSProperties} />)}</div>
      <div className="clarity__cards" aria-hidden="true">{tasks.map((task, index) => <span className="clarity__node" key={task} style={{ "--node": index } as React.CSSProperties}><svg viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{icons[index]}</svg><span>{task}</span></span>)}</div>
    </div>
    <div className="clarity__controls" role="group" aria-label="Explore complexity, clarity and order">
      {stages.map((item, index) => <button type="button" key={item.name} aria-pressed={stage === index} aria-controls={id} onClick={() => select(index)}>{item.name}<span aria-hidden="true">{index < 2 ? " \u2192" : " \u2713"}</span></button>)}
    </div>
    <p id={id} aria-live="polite">{stages[stage].text}</p>
    <span className="clarity__hint">Select a stage to explore the change.</span>
  </div>;
}

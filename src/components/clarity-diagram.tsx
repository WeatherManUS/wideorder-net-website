"use client";
import { useId, useRef, useState } from "react";
const stages = [
  { name: "Complexity", text: "Disconnected tasks. Repeated effort. Too much depends on a workaround." },
  { name: "Clarity", text: "Understand the connections. Find the constraint. Choose what matters." },
  { name: "Order", text: "A simpler flow. Clear responsibilities. Work that moves forward." },
];
const tasks = ["People", "Systems", "Information", "Decisions", "Processes", "Outcomes"];
export function ClarityDiagram() {
  const [stage, setStage] = useState(0);
  const id = useId();
  const surface = useRef<HTMLDivElement>(null);
  return <div className="clarity" ref={surface} data-stage={stage} onPointerMove={event => {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    surface.current?.style.setProperty("--pointer-x", `${((event.clientX - bounds.left) / bounds.width - .5) * 6}px`);
  }} onPointerLeave={() => surface.current?.style.setProperty("--pointer-x", "0px")}>
    <div className="clarity__heading"><span>From friction to flow</span><span aria-hidden="true">0{stage + 1} / 03</span></div>
    <div className="clarity__canvas" aria-hidden="true">{tasks.map((task, index) => <span className="clarity__node" key={task} style={{ "--node": index } as React.CSSProperties}><i />{task}</span>)}</div>
    <div className="clarity__controls" role="group" aria-label="Explore complexity, clarity and order">
      {stages.map((item, index) => <button type="button" key={item.name} aria-pressed={stage === index} aria-controls={id} onClick={() => setStage(index)}>{item.name}<span aria-hidden="true">{index < 2 ? " \u2192" : " \u2713"}</span></button>)}
    </div>
    <p id={id} aria-live="polite">{stages[stage].text}</p>
    <span className="clarity__hint">Select a stage to explore the change.</span>
  </div>;
}

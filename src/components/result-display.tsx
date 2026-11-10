function Metric({ value }: { value: string }) {
  const match = /^(up to )?(~?[\d,]+)(.*)$/.exec(value);
  if (!match) return <span>{value}</span>;
  return (
    <span className="result-display__value">
      {match[1] ? <span className="result-display__qualifier">{match[1]}</span> : null}
      <span className="result-display__number">{match[2]}</span>
      {match[3] ? <span className="result-display__unit">{match[3].trim()}</span> : null}
    </span>
  );
}

/** Derives the presentation from the approved result, without introducing new claims. */
export function ResultDisplay({ result }: { result: string }) {
  const [before, after] = result.split(" -> ");
  return (
    <div className={`result-display${after ? " result-display--comparison" : ""}`}>
      <span className="sr-only">{result}</span>
      <div className="result-display__visual" aria-hidden="true">
        {after ? (
          <>
            <div className="result-display__before"><span className="result-display__label">Before</span><Metric value={before} /></div>
            <span className="result-display__arrow">↗</span>
            <div className="result-display__after"><span className="result-display__label">After</span><Metric value={after} /></div>
          </>
        ) : <Metric value={before} />}
      </div>
    </div>
  );
}

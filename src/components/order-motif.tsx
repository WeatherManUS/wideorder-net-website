/** A small, theme-aware visual metaphor; never a replacement for the brand mark. */
export function OrderMotif() {
  return (
    <figure className="order-motif" aria-label="From complexity, through clarity, to order">
      <div className="order-motif__index" aria-hidden="true"><span>01 / 03</span><span>WideOrder Resolve</span></div>
      <svg viewBox="0 0 480 300" fill="none" aria-hidden="true" focusable="false">
        <g className="order-motif__guides" stroke="currentColor" strokeWidth="1">
          <path d="M0 60H480M0 150H480M0 240H480M80 0V300M240 0V300M400 0V300" />
        </g>
        <g className="order-motif__complexity" stroke="currentColor" strokeWidth="2">
          <path d="M24 96L131 206L37 183L125 76L62 222L24 96L141 137L37 183M62 222L83 81L131 206M24 96L125 76" />
          <rect x="18" y="90" width="12" height="12" fill="currentColor" stroke="none" />
          <rect x="125" y="200" width="12" height="12" fill="currentColor" stroke="none" />
          <rect x="119" y="70" width="12" height="12" fill="currentColor" stroke="none" />
          <rect x="31" y="177" width="12" height="12" fill="currentColor" stroke="none" />
        </g>
        <path className="order-motif__connector" d="M147 150H184M289 150H326" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" />
        <g className="order-motif__clarity" stroke="currentColor" strokeWidth="2">
          <path d="M200 105H278M200 135H255M200 165H278M200 195H255" />
          <path d="M200 96V204" />
          <rect x="235" y="129" width="20" height="12" fill="currentColor" stroke="none" />
          <rect x="258" y="159" width="20" height="12" fill="currentColor" stroke="none" />
        </g>
        <g className="order-motif__order" fill="currentColor">
          {[0, 1, 2].flatMap((row) => [0, 1, 2].map((column) => (
            <rect key={`${row}-${column}`} x={348 + column * 36} y={99 + row * 36} width="29" height="29" />
          )))}
        </g>
        <path className="order-motif__accent" d="M348 223H449" stroke="currentColor" strokeWidth="3" />
      </svg>
      <figcaption><span>Complexity</span><span>Clarity</span><span>Order</span></figcaption>
    </figure>
  );
}

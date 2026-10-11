type BrandMarkProps = {
  href?: string;
  priority?: boolean;
  className?: string;
};

export function BrandMark({ href = "#top", className = "" }: BrandMarkProps) {
  const classes = ["brand-mark", className].filter(Boolean).join(" ");

  return (
    <a className={classes} href={href}>
      <span className="sr-only">WideOrder</span>
      <span className="brand-mark__image" aria-hidden="true" />
    </a>
  );
}

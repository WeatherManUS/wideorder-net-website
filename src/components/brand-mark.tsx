import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  priority?: boolean;
  className?: string;
};

export function BrandMark({ href = "/", className = "" }: BrandMarkProps) {
  const classes = ["brand-mark", className].filter(Boolean).join(" ");

  return (
    <Link className={classes} href={href}>
      <span className="sr-only">WideOrder</span>
      <span className="brand-mark__image" aria-hidden="true" />
    </Link>
  );
}

import Image from "next/image";

type BrandMarkProps = {
  href?: string;
  priority?: boolean;
  className?: string;
};

export function BrandMark({ href = "#top", priority = false, className = "" }: BrandMarkProps) {
  const classes = ["brand-mark", className].filter(Boolean).join(" ");

  return (
    <a className={classes} href={href}>
      <span className="sr-only">WideOrder</span>
      <Image
        className="theme-logo theme-logo--light"
        src="/brand/wideorder-logo-light.png"
        alt=""
        aria-hidden="true"
        width={4743}
        height={1132}
        sizes="(max-width: 767px) 190px, 240px"
        priority={priority}
      />
      <Image
        className="theme-logo theme-logo--dark"
        src="/brand/wideorder-logo-dark.png"
        alt=""
        aria-hidden="true"
        width={4743}
        height={1132}
        sizes="(max-width: 767px) 190px, 240px"
        priority={priority}
      />
    </a>
  );
}

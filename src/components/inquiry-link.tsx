import Link from "next/link";
export const INQUIRY_HREF = "/contact#inquiry-form";
export function InquiryLink({ children = "Start a conversation" }: { children?: React.ReactNode }) {
  return <Link className="button button--primary" href={INQUIRY_HREF}>{children}</Link>;
}

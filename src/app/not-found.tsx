import { SiteFooter } from "@/components/site-shell";
﻿import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export default function NotFound() {
  return (
    <>
    <main className="not-found">
      <div className="container container--narrow">
        <div className="not-found__card">
          <BrandMark href="/" />
          <div>
            <h1 className="section-title">Page not found.</h1>
          </div>
          <div className="not-found__actions">
            <Link className="button button--primary" href="/">
              Return to WideOrder
            </Link>
          </div>
        </div>
      </div>
    </main>
    <SiteFooter utility />
    </>
  );
}

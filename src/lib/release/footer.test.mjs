import assert from "node:assert/strict";
import test from "node:test";
import { copyrightYear, footerVersionEnabled, formatPublicationTime } from "./footer.ts";
import { verifyHtmlFooter } from "./publication.ts";

test("publication formatting uses Chicago CST/CDT and retains the UTC source timestamp", () => {
  assert.equal(formatPublicationTime("2026-11-10T18:45:00.000Z"), "Nov 10, 2026 at 12:45 PM CST");
  assert.equal(formatPublicationTime("2026-07-10T18:45:00.000Z"), "Jul 10, 2026 at 1:45 PM CDT");
  assert.equal(formatPublicationTime(null), null);
  assert.equal(formatPublicationTime("not-a-date"), null);
});
test("copyright follows Chicago year at a UTC year boundary and the display has one flag", () => {
  assert.equal(copyrightYear(new Date("2027-01-01T03:00:00.000Z")), "2026");
  assert.equal(copyrightYear(new Date("2027-01-01T08:00:00.000Z")), "2027");
  assert.equal(footerVersionEnabled({}), true);
  assert.equal(footerVersionEnabled({ SHOW_FOOTER_VERSION: "false" }), false);
});
test("HTML verification rejects mismatched publication timestamps and supports hiding the line", () => {
  const expected = { version: "0.1.0", releaseId: "fixture", publishedAt: "2026-11-10T18:45:00.000Z" };
  const html = '<footer><p data-footer-version-enabled="true"><span data-footer-release="fixture" data-release-version="0.1.0">v0.1.0 · Published <time datetime="2026-11-10T18:45:00.000Z">Nov 10, 2026 at 12:45 PM CST</time></span></p></footer>';
  assert.equal(verifyHtmlFooter(html, expected), true);
  assert.throws(() => verifyHtmlFooter(html, { ...expected, publishedAt: "2026-11-10T17:45:00.000Z" }), /differs/);
  assert.equal(verifyHtmlFooter('<footer><p data-footer-version-enabled="false">Copyright</p></footer>', expected), false);
  assert.throws(() => verifyHtmlFooter("<footer>Missing release markup</footer>", expected), /missing/);
});

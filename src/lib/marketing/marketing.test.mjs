import assert from "node:assert/strict";
import test from "node:test";
import { resolveConsent, readCampaign, sanitizeEvent, tagSafeLocation, googleCampaignFields, CONSENT_TTL } from "./model.ts";
import { buildCampaignUrl } from "./utm.ts";
import { getTrackingConfig, getSocialProfiles } from "../../config/marketing.ts";

test("consent defaults, expiration, future timestamps, GPC, DNT and independent categories", () => {
  const now = Date.now();
  const all = { version: 1, analytics: true, marketing: true, updatedAt: now };
  for (const input of [null, {}, { ...all, updatedAt: NaN }, { ...all, updatedAt: now - CONSENT_TTL - 1 }, { ...all, updatedAt: now + 1 }, { ...all, version: 2 }]) assert.equal(resolveConsent(input, {}, now).analytics, false);
  assert.equal(resolveConsent(all, { gpc: true }, now).marketing, false);
  assert.equal(resolveConsent(all, { gpc: true }, now).analytics, true);
  assert.equal(resolveConsent(all, { dnt: true }, now).analytics, false);
  assert.equal(resolveConsent({ ...all, analytics: false }, {}, now).marketing, true);
});
test("events discard arbitrary names, form content, PII and unsafe paths", () => {
  assert.equal(sanitizeEvent("invented", {}), null);
  const result = sanitizeEvent("cta_click", { page_id: "/contact?email=private@example.test", name: "Private", email: "private@example.test", phone: "555-0100", message: "secret", cta_position: "hero", interaction_type: "private@example.test" });
  assert.deepEqual(result, { page_id: "other", cta_position: "hero" });
  assert.equal(sanitizeEvent("generate_lead", { lead_id: "email@example.test" }), null);
  assert.ok(sanitizeEvent("generate_lead", { lead_id: "10000000-0000-4000-8000-000000000001" }));
});
test("campaign URLs preserve parameters/fragments and reject ambiguity", () => {
  const input = { destination: "/our-work/month-end-reporting?view=details#result", source: "linkedin", medium: "organic_social", campaign: "process_improvement", content: "reporting_case_study" };
  const url = new URL(buildCampaignUrl(input));
  assert.equal(url.hash, "#result"); assert.equal(url.searchParams.get("view"), "details");
  assert.equal(url.searchParams.get("utm_source"), "linkedin");
  for (const destination of ["https://evil.test/", "/?utm_source=x", "/?utm_source=linkedin&utm_source=linkedin", "/?UTM_SOURCE=linkedin", "/?utm_custom=value"]) assert.throws(() => buildCampaignUrl({ ...input, destination }));
  assert.throws(() => buildCampaignUrl({ ...input, campaign: "Private@example.test" }));
  assert.equal(new URL(buildCampaignUrl({ ...input, destination: "/?utm_source=linkedin" })).searchParams.getAll("utm_source").length, 1);
});
test("attribution accepts only unique slug labels; raw personal query prevents provider loading", () => {
  assert.deepEqual(readCampaign("?utm_source=linkedin&utm_medium=organic_social&utm_campaign=reporting&email=private@example.test"), { utm_source: "linkedin", utm_medium: "organic_social", utm_campaign: "reporting" });
  assert.deepEqual(readCampaign("?utm_source=one&utm_source=two&utm_content=private@example.test"), {});
  assert.equal(tagSafeLocation("/contact", "?email=private@example.test", ""), false);
  assert.equal(tagSafeLocation("/admin/login", "", ""), false);
  assert.equal(tagSafeLocation("/", "?utm_source=linkedin", "#retail-pricing"), true);
  assert.equal(tagSafeLocation("/", "?gclid=valid_click_id_1234", ""), false);
  assert.equal(tagSafeLocation("/", "?gclid=valid_click_id_1234", "", true), true);
  assert.equal(tagSafeLocation("/", "?gclid=private@example.test", "", true), false);
});
test("tracking requires master flag and per-provider valid public ID; no tokens escape", () => {
  const env = { MARKETING_TRACKING_ENABLED: "true", MARKETING_GA4_ENABLED: "true", MARKETING_GA4_ID: "G-TEST1234", MARKETING_META_ENABLED: "true", MARKETING_META_ID: "not-valid", SECRET_TOKEN: "must-not-leak" };
  assert.equal(getTrackingConfig(env).ga4, "G-TEST1234");
  assert.equal(getTrackingConfig(env).meta, "");
  assert.equal(getTrackingConfig({ ...env, MARKETING_TRACKING_ENABLED: "false" }).ga4, "");
  assert.ok(!JSON.stringify(getTrackingConfig(env)).includes("must-not-leak"));
});
test("social references require explicit verification, exact HTTPS host and a profile path", () => {
  assert.deepEqual(getSocialProfiles({ SOCIAL_LINKEDIN_URL: "https://www.linkedin.com/company/wideorder" }), []);
  assert.equal(getSocialProfiles({ SOCIAL_LINKEDIN_VERIFIED: "true", SOCIAL_LINKEDIN_URL: "https://www.linkedin.com/company/wideorder" }).length, 1);
  for (const url of ["https://linkedin.com.evil.test/company/wideorder", "javascript:alert(1)", "https://linkedin.com/", "https://user:password@linkedin.com/company/name", "https://linkedin.com/company/name?token=secret"]) assert.deepEqual(getSocialProfiles({ SOCIAL_LINKEDIN_VERIFIED: "true", SOCIAL_LINKEDIN_URL: url }), []);
});

test("extension and outbound events retain only their documented non-personal fields", () => {
  for (const [name, parameters] of [
    ["case_study_interaction", { case_study_id: "month-end-reporting", interaction_type: "comparison_toggle" }],
    ["social_outbound_click", { platform: "linkedin", cta_position: "footer" }],
    ["video_engagement", { content_id: "reporting_demo", interaction_type: "half_watched" }],
    ["resource_download", { content_id: "reporting_guide", content_category: "case_study" }],
  ]) assert.deepEqual(sanitizeEvent(name, { page_id: "/our-work", ...parameters, email: "private@example.test", message: "private content", arbitrary_url: "https://private.test" }), { page_id: "/our-work", ...parameters });
});

test("GA4 gets campaign_name from utm_campaign without confusing it with utm_id", () => {
  assert.deepEqual(googleCampaignFields({ utm_source: "linkedin", utm_medium: "organic_social", utm_campaign: "process_improvement", utm_content: "reporting_v1" }), { campaign_source: "linkedin", campaign_medium: "organic_social", campaign_name: "process_improvement", campaign_content: "reporting_v1" });
  assert.deepEqual(googleCampaignFields(null), {});
  assert.deepEqual(googleCampaignFields({ utm_source: "direct", utm_medium: "none" }), {});
  assert.equal(googleCampaignFields({ utm_campaign: "private@example.test" }).campaign_name, undefined);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inquiryMail } from './mail.ts';
const inquiry = { reference: '12345678-0000-4000-8000-123456789abc', submittedAt: '2026-11-11T04:00:00Z', contact: { name: '<script>alert(1)</script>', company: '', email: 'visitor@example.test', phone: '', message: '<img src=x onerror=alert(1)>' }, sourcePage: '/contact', campaign: { utm_source: 'permitted-fixture' } };
const config = { from: 'site@example.test', recipient: 'inbox@example.test', fromName: 'WideOrder' };
test('branded internal mail escapes content and preserves context and plain text', () => {
  const mail = inquiryMail(inquiry, config);
  assert.ok(mail.html.includes('&lt;script&gt;'));
  assert.ok(!mail.html.includes('<script>'));
  assert.ok(mail.text.includes(inquiry.reference));
  assert.ok(mail.text.includes('permitted-fixture'));
  assert.ok(mail.text.includes('America/Chicago'));
  assert.ok(mail.html.includes('role="presentation"'));
  assert.deepEqual(mail.envelope.to, [config.recipient]);
});
test('optional acknowledgment is concise and excludes raw identifiers, time and tracking', () => {
  const mail = inquiryMail(inquiry, config, true);
  for (const content of [mail.html, mail.text, mail.subject]) {
    assert.ok(!content.includes(inquiry.reference));
    assert.ok(!content.includes(inquiry.submittedAt));
    assert.ok(!content.includes('permitted-fixture'));
  }
  assert.match(mail.text, /We've received your message and will review it/);
  assert.ok(!mail.html.includes('<img'));
  assert.ok(!mail.html.includes('<script'));
  assert.deepEqual(mail.envelope.to, [inquiry.contact.email]);
});

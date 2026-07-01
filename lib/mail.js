// Shared mail helper for the Vercel serverless functions in /api.
//
// Sends email through the Resend HTTP API using the runtime's built-in fetch —
// no SDK dependency, in keeping with the site's zero-dependency build.
//
// Environment variables (set in the Vercel project → Settings → Environment Variables):
//   RESEND_API_KEY  (required)  your Resend API key, e.g. re_xxx
//   MAIL_FROM       (optional)  overrides the interim test sender
//   MAIL_TO         (optional)  overrides the interim recipient
//
// Interim defaults use Resend's shared sandbox sender (onboarding@resend.dev),
// which requires no domain verification. Once the client's domain DNS is set up
// and verified in Resend, set MAIL_FROM / MAIL_TO to the real addresses.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const DEFAULT_FROM = 'Conservatory Conversions <onboarding@resend.dev>';
const DEFAULT_TO = 'dan@laventusdigital.co.uk';

// Escape user-supplied values before interpolating into the HTML email body.
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Read and JSON-parse the request body. Vercel normally parses req.body for us,
// but fall back to reading the raw stream if it arrives unparsed.
async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length) {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch (e) { return {}; }
}

// Build an HTML + plain-text email body from an array of [label, value] rows.
function renderRows(heading, rows, footer) {
  const html =
    `<h2 style="font-family:Arial,Helvetica,sans-serif;margin:0 0 16px">${escapeHtml(heading)}</h2>` +
    '<table style="font-family:Arial,Helvetica,sans-serif;border-collapse:collapse;font-size:14px">' +
    rows.map(function (row) {
      return '<tr>' +
        '<td style="padding:6px 14px 6px 0;font-weight:bold;vertical-align:top;white-space:nowrap">' +
        escapeHtml(row[0]) + '</td>' +
        '<td style="padding:6px 0;vertical-align:top">' +
        escapeHtml(row[1]).replace(/\n/g, '<br>') + '</td>' +
        '</tr>';
    }).join('') +
    '</table>' +
    (footer ? `<p style="font-family:Arial,Helvetica,sans-serif;color:#666;font-size:13px;margin-top:20px">${escapeHtml(footer)}</p>` : '');

  const text = rows.map(function (row) { return row[0] + ': ' + row[1]; }).join('\n');
  return { html: html, text: text };
}

async function sendEmail(opts) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');

  const payload = {
    from: process.env.MAIL_FROM || DEFAULT_FROM,
    to: process.env.MAIL_TO || DEFAULT_TO,
    subject: opts.subject,
    html: opts.html,
  };
  if (opts.text) payload.text = opts.text;
  if (opts.replyTo) payload.reply_to = opts.replyTo;

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text().catch(function () { return ''; });
    throw new Error('Resend API ' + res.status + ': ' + detail);
  }
  return res.json();
}

// Basic email sanity check — not exhaustive, just enough to reject obvious junk.
function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

module.exports = { sendEmail, readJsonBody, renderRows, escapeHtml, isValidEmail };

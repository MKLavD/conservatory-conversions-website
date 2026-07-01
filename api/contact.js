// POST /api/contact — receives a quote-request submission from the contact form
// and emails it to the business via Resend.

const { sendEmail, readJsonBody, renderRows, isValidEmail } = require('../lib/mail');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let data;
  try { data = await readJsonBody(req); } catch (e) { data = {}; }

  const name = (data.name || '').trim();
  const phone = (data.phone || '').trim();
  const postcode = (data.postcode || '').trim();
  const email = (data.email || '').trim();
  const style = (data.style || '').trim();
  const roof = (data.roof || '').trim();
  const message = (data.message || '').trim();

  if (!name || !phone || !postcode || !email) {
    return res.status(400).json({ error: 'Please complete all required fields.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const body = renderRows('New quote request', [
    ['Name', name],
    ['Phone', phone],
    ['Email', email],
    ['Postcode', postcode],
    ['Conservatory style', style || '—'],
    ['Roof option', roof || '—'],
    ['Message', message || '—'],
  ]);

  try {
    await sendEmail({
      subject: 'New quote request — ' + name + ' (' + postcode + ')',
      html: body.html,
      text: body.text,
      replyTo: email,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact form send failed:', err);
    return res.status(502).json({ error: 'Could not send your request. Please try again, or call us directly.' });
  }
};

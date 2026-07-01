// POST /api/brochure — receives a brochure-download request from the modal form
// and emails the lead's details to the business via Resend.

const { sendEmail, readJsonBody, renderRows, isValidEmail } = require('../lib/mail');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let data;
  try { data = await readJsonBody(req); } catch (e) { data = {}; }

  const name = (data.name || '').trim();
  const email = (data.email || '').trim();
  const postcode = (data.postcode || '').trim();

  if (!name || !email || !postcode) {
    return res.status(400).json({ error: 'Please complete all fields.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const body = renderRows(
    'Brochure request',
    [
      ['Name', name],
      ['Email', email],
      ['Postcode', postcode],
    ],
    'Follow up by sending the brochure to this lead.'
  );

  try {
    await sendEmail({
      subject: 'Brochure request — ' + name + ' (' + postcode + ')',
      html: body.html,
      text: body.text,
      replyTo: email,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('brochure form send failed:', err);
    return res.status(502).json({ error: 'Could not send your request. Please try again.' });
  }
};

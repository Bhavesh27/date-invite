// ─────────────────────────────────────────────────────────────────────────────
// Vercel Serverless Function — fires when she clicks "Yes, I'd love that 💕"
//
// SETUP (one-time, ~5 minutes):
//
//  1. Sign up free at resend.com → Dashboard → API Keys → Create API Key
//  2. Copy the key (starts with re_...)
//  3. In Vercel: your project → Settings → Environment Variables, add:
//       RESEND_API_KEY  =  re_xxxxxxxxxxxxxxxxxxxx
//       NOTIFY_EMAIL    =  bhavesh.kumar@flipkart.com   (or your personal email)
//  4. Deploy — that's it. You'll get an email the moment she says yes.
//
// Note: On localhost the fetch from index.html will fail gracefully (no env vars).
//       This only fires when running on Vercel.
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { venue, vibe, dist } = req.body || {};
  const apiKey      = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;

  if (!apiKey || !notifyEmail) {
    console.warn('[notify] RESEND_API_KEY or NOTIFY_EMAIL not set — skipping email');
    return res.status(200).json({ ok: true, note: 'env vars not configured' });
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Date Invite <onboarding@resend.dev>',
        to: [notifyEmail],
        subject: '🎉 She said YES to dinner!',
        html: `
          <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:36px 28px;background:#0d0a1a;color:#f0eaf8;border-radius:20px;border:1px solid rgba(168,85,247,0.3)">
            <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#f5c842;margin-bottom:12px">💌 It happened</div>
            <h1 style="font-size:36px;margin:0 0 6px;color:#f5c842">She said YES! 🥂</h1>
            <p style="color:#9b8fb5;margin:0 0 28px;font-size:14px">Here's everything she picked:</p>

            <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:22px;margin-bottom:24px">
              <div style="margin-bottom:14px">
                <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a855f7;margin-bottom:4px">Venue</div>
                <div style="font-size:16px;font-weight:600">${venue || 'Not captured'}, Indiranagar</div>
              </div>
              <div style="margin-bottom:14px">
                <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a855f7;margin-bottom:4px">Distance from her</div>
                <div style="font-size:15px">${dist || '—'}</div>
              </div>
              <div style="margin-bottom:14px">
                <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a855f7;margin-bottom:4px">Vibe she chose</div>
                <div style="font-size:14px;color:#9b8fb5;line-height:1.5">${vibe || '—'}</div>
              </div>
              <div>
                <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a855f7;margin-bottom:4px">When</div>
                <div style="font-size:15px">Sunday · July 6, 2026 · 5:00 PM</div>
              </div>
            </div>

            <p style="color:#f5c842;font-size:15px;margin:0">Go make that reservation! 🍽️</p>
          </div>
        `,
      }),
    });

    if (!r.ok) {
      const body = await r.text();
      console.error('[notify] Resend error:', body);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[notify] Unexpected error:', err.message);
    return res.status(200).json({ ok: true }); // always succeed so the user experience is unaffected
  }
}

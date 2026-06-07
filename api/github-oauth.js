export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { code } = req.query
  if (!code) return res.status(400).json({ error: 'missing_code' })

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: 'not_configured',
      message: 'Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in Vercel environment variables.'
    })
  }

  try {
    const ghRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
    })
    const data = await ghRes.json()
    if (data.error) return res.status(400).json(data)
    res.json({ access_token: data.access_token, token_type: data.token_type, scope: data.scope })
  } catch (e) {
    res.status(500).json({ error: 'exchange_failed', message: e.message })
  }
}

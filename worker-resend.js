addEventListener('fetch', event => {
  event.respondWith(handle(event.request));
});

async function handle(request) {
  if (request.method !== 'POST') return new Response('Método no permitido', { status: 405 });

  try {
    const data = await request.json();

    const bodyHtml = `
      <h3>Prueba aprobada</h3>
      <p><strong>Cliente/Proyecto:</strong> ${escapeHtml(data.client_proy || '')}</p>
      <p><strong>Tag:</strong> ${escapeHtml(data.tag || '')}</p>
      <p><strong>Set:</strong> ${escapeHtml(String(data.set) || '')} PSI</p>
      <p><strong>Sección:</strong> ${escapeHtml(data.seccion || '')}</p>
      <p><strong>Tipo:</strong> ${escapeHtml(data.tipo || '')}</p>
      <p><strong>Manómetro:</strong> ${escapeHtml(data.manometro || '')}</p>
      <p><strong>Presiones:</strong> ${(data.presiones || []).map(p=>escapeHtml(String(p))).join(', ')}</p>
      <p><strong>Promedio:</strong> ${escapeHtml(String(data.promedio))}</p>
      <p><strong>Fecha:</strong> ${escapeHtml(data.fecha || '')}</p>
    `;

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'No API key configured' }), { status: 500, headers: corsHeaders() });
    }

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Valser <noreply@yourdomain.com>',
        to: ['tecnicodeservicios@valserindustriales.com'],
        subject: `Prueba aprobada - ${escapeHtml(data.tag || '')}`,
        html: bodyHtml
      })
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error('Resend error:', t);
      return new Response(JSON.stringify({ error: 'Error sending' }), { status: 502, headers: corsHeaders() });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders() });

  } catch (err) {
    console.error('Worker internal error', err);
    return new Response(JSON.stringify({ error: 'Internal' }), { status: 500, headers: corsHeaders() });
  }
}

function escapeHtml(s){ return (s||'').toString().replace(/[&<>"'`]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;",'`':'&#96;'})[c]); }
function corsHeaders(){ return { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' }; }

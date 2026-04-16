// Cloudflare Pages Function - D1 Database API

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || 'default';
  
  try {
    const { results } = await env.DB.prepare(
      'SELECT data FROM user_data WHERE user_id = ?'
    ).bind(userId).all();
    
    if (results.length > 0) {
      return new Response(results[0].data, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('{}', {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || 'default';
  
  try {
    const data = await request.text();
    
    // Upsert data
    await env.DB.prepare(
      `INSERT INTO user_data (user_id, data, updated_at) 
       VALUES (?, ?, datetime('now')) 
       ON CONFLICT(user_id) DO UPDATE SET 
       data = excluded.data, 
       updated_at = excluded.updated_at`
    ).bind(userId, data).run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || 'default';
  
  try {
    await env.DB.prepare(
      'DELETE FROM user_data WHERE user_id = ?'
    ).bind(userId).run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

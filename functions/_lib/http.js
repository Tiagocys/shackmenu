export function json(data, status = 200) {
  return Response.json(data, { status });
}

export async function authenticate(request, env) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const supabaseUrl = env.SUPABASE_URL || env.project_url;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY;

  if (!token || !supabaseUrl || !supabaseAnonKey) {
    return { error: json({ error: "Sessão inválida." }, 401) };
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { error: json({ error: "Sessão expirada. Entre novamente com o Google." }, 401) };
    }

    const user = await response.json();
    return user.id ? { user } : { error: json({ error: "Sessão inválida." }, 401) };
  } catch (error) {
    console.error("Could not validate Supabase session", error);
    return { error: json({ error: "Não foi possível validar sua sessão." }, 503) };
  }
}

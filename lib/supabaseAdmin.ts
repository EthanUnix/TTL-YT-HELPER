import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured on the server.')
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function getAuthenticatedUser(request: Request) {
  const authorization = request.headers.get('authorization')
  const accessToken = authorization?.replace(/^Bearer\s+/i, '').trim()

  if (!accessToken) return null

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken)
  return error ? null : data.user
}

export async function getUserApiKeys(request: Request) {
  const user = await getAuthenticatedUser(request)
  if (!user) return { user: null, keys: null }

  const { data: keys, error } = await supabaseAdmin
    .from('user_api_keys')
    .select('gemini_key, huggingface_key, pexels_key')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  return { user, keys }
}

export async function uploadPublicAsset(path: string, data: Buffer | string, contentType: string) {
  const { error } = await supabaseAdmin.storage.from('content-assets').upload(path, data, {
    contentType,
    upsert: true,
  })

  if (error) throw error
  return supabaseAdmin.storage.from('content-assets').getPublicUrl(path).data.publicUrl
}

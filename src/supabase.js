import { createClient } from '@supabase/supabase-js'

// 請將下面兩行換成你在第二步取得的真實 URL 與 Anon Key
const SUPABASE_URL = '你的_SUPABASE_URL'
const SUPABASE_ANON_KEY = '你的_SUPABASE_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

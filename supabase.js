import { createClient } from '@supabase/supabase-js'

// 直接寫死你的 Supabase 網址與 Anon Key，徹底解決 Vercel 讀唔到環境變數嘅問題
const SUPABASE_URL = 'https://ulavwdyoklsiwxcsmqjf.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_Dk93ahTb1lAg7D4Y979vDw_KMo_1jrW' 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

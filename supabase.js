import { createClient } from '@supabase/supabase-js'

// 直接寫死你的 Supabase 網址與 Anon Key，徹底解決 Vercel 讀唔到環境變數嘅問題
const SUPABASE_URL = 'https://ulavwdyoklsiwxcsmqjf.supabase.co'
const SUPABASE_ANON_KEY = '請把你的 VITE_SUPABASE_ANON_KEY 貼在這裡' 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

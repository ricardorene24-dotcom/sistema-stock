import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dwpopmerdncjrgafdofx.supabase.co'
const supabaseKey = 'sb_publishable_F-Z-QU-saCMJwJNO7HZ1TA_-MBI0wI3'

export const supabase = createClient(supabaseUrl, supabaseKey)

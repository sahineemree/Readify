// src/config/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// .env dosyasındaki değişkenleri yükle
dotenv.config();

// .env dosyasından URL ve anahtarı al
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Değişkenlerin var olup olmadığını kontrol et, yoksa hata fırlat
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL ve Anon Key .env dosyasında bulunamadı.');
}

// Supabase client'ını oluştur ve dışa aktar
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
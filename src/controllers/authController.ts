// src/controllers/authController.ts

import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

/**
 * @desc   Yeni bir kullanıcı kaydı oluşturur.
 * @route  POST /api/auth/register
 * @access Public
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;

    // Frontend'den email ve şifrenin geldiğinden emin olalım
    if (!email || !password || !username) {
      return res.status(400).json({ message: 'Lütfen email, şifre ve kullanıcı adı alanlarını doldurun.' });
    }

    // Supabase Auth ile kullanıcıyı oluştur
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      // Supabase'den gelen hatayı direkt olarak frontend'e gönder
      return res.status(400).json({ message: authError.message });
    }

    if (!authData.user) {
        return res.status(500).json({ message: 'Kullanıcı oluşturuldu ancak kullanıcı verisi alınamadı.' });
    }

    // Şimdi oluşturulan kullanıcının bilgilerini kendi 'users' tablomuza kaydedelim.
    // Bu sayede profiline ek bilgiler (username gibi) ekleyebiliriz.
    const { error: profileError } = await supabase
      .from('users') // Supabase'de oluşturduğun tablonun adı 'users' olmalı
      .insert({ 
        id: authData.user.id, // Auth kullanıcısının ID'si ile aynı ID'yi veriyoruz
        email: authData.user.email,
        username: username 
      });

    if (profileError) {
      // Eğer profil oluşturmada hata olursa, bu bir sunucu hatasıdır.
      return res.status(500).json({ message: 'Kullanıcı profili oluşturulurken bir hata oluştu: ' + profileError.message });
    }

    // Her şey başarılıysa, 201 (Created) durum koduyla kullanıcı bilgisini dön
    res.status(201).json({ user: authData.user });

  } catch (error) {
    res.status(500).json({ message: 'Sunucuda beklenmedik bir hata oluştu.', error });
  }
};

/**
 * @desc   Mevcut bir kullanıcıyı doğrular ve oturum başlatır.
 * @route  POST /api/auth/login
 * @access Public
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Lütfen email ve şifre alanlarını doldurun.' });
    }

    // Supabase Auth ile kullanıcı girişi yap
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // Başarılı girişte session bilgisini (JWT token içerir) frontend'e gönder
    res.status(200).json({ session: data.session });

  } catch (error) {
    res.status(500).json({ message: 'Sunucuda beklenmedik bir hata oluştu.', error });
  }
};

/**
 * @desc   Kullanıcının oturumunu sonlandırır.
 * @route  POST /api/auth/logout
 * @access Private (Genellikle frontend'den token ile yapılır)
 */
export const logoutUser = async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(500).json({ message: error.message });
    }
    
    // Başarılı çıkışta basit bir mesaj gönder
    res.status(200).json({ message: 'Başarıyla çıkış yapıldı.' });

  } catch (error) {
    res.status(500).json({ message: 'Sunucuda beklenmedik bir hata oluştu.', error });
  }
};
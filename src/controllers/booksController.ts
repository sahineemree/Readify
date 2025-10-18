// src/controllers/booksController.ts

import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

/**
 * @desc   Giriş yapmış kullanıcının kütüphanesindeki tüm kitapları listeler.
 * @route  GET /api/books
 * @access Private
 */
export const getUserBooks = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id; // Middleware sayesinde kullanıcı ID'sine erişiyoruz.

    // user_books tablosundan kullanıcının kayıtlarını çekerken,
    // book_id üzerinden books tablosundaki tüm kitap bilgilerini de "join" ile alıyoruz.
    const { data, error } = await supabase
      .from('user_books')
      .select(`
        *,
        books (
          title,
          author,
          page_count,
          cover_image_url
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Kitaplar getirilirken bir hata oluştu.', error });
  }
};

/**
 * @desc   Kullanıcının kütüphanesine yeni bir kitap ekler.
 * @route  POST /api/books
 * @access Private
 */
export const addBookToUserLibrary = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { title, author, page_count } = req.body;

    if (!title || !author || !page_count) {
      return res.status(400).json({ message: 'Lütfen tüm alanları doldurun: title, author, page_count' });
    }

    // 1. Kitap daha önce 'books' ana tablosuna eklenmiş mi diye kontrol et.
    let { data: existingBook } = await supabase
      .from('books')
      .select('id')
      .eq('title', title)
      .eq('author', author)
      .single(); // .single() sadece bir sonuç beklediğimizi söyler.

    let bookId;

    // 2. Eğer kitap ana tabloda yoksa, önce oraya ekle.
    if (!existingBook) {
      const { data: newBook, error: newBookError } = await supabase
        .from('books')
        .insert({ title, author, page_count })
        .select('id')
        .single();

      if (newBookError) throw newBookError;
      bookId = newBook.id;
    } else {
      bookId = existingBook.id;
    }

    // 3. Kullanıcının bu kitabı zaten ekleyip eklemediğini kontrol et.
    const { data: userBookLink, error: linkError } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .single();
    
    if (userBookLink) {
        return res.status(409).json({ message: 'Bu kitap zaten kütüphanenizde mevcut.' });
    }
    if (linkError && linkError.code !== 'PGRST116') { // PGRST116: "kayıt bulunamadı" hatasıdır, bu bizim için normal.
        throw linkError;
    }


    // 4. 'user_books' tablosuna kullanıcı ile kitap arasındaki bağlantıyı ekle.
    const { data: newUserBook, error: userBookError } = await supabase
      .from('user_books')
      .insert({ user_id: userId, book_id: bookId, status: 'want_to_read' })
      .select()
      .single();

    if (userBookError) throw userBookError;

    res.status(201).json(newUserBook);
  } catch (error) {
    res.status(500).json({ message: 'Kitap eklenirken bir hata oluştu.', error });
  }
};


// Update book progress controller function
/**
 * @desc   Bir kullanıcının kütüphanesindeki bir kitabın ilerlemesini günceller.
 * @route  PATCH /api/books/:userBookId
 * @access Private
 */
export const updateBookProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    // --- DEĞİŞİKLİK BURADA BAŞLIYOR ---
    
    // 1. URL'den gelen string'i alıp sayıya çeviriyoruz.
    const userBookId = parseInt(req.params.userBookId, 10);
    
    // 2. Eğer gelen değer bir sayı değilse (örn: /api/books/abc), hata verelim.
    if (isNaN(userBookId)) {
        return res.status(400).json({ message: 'Geçersiz kitap IDsi. Lütfen bir sayı girin.' });
    }

    // --- DEĞİŞİKLİK BURADA BİTİYOR ---
    
    const { progress_pages } = req.body;

    if (progress_pages === undefined) {
      return res.status(400).json({ message: 'Lütfen progress_pages değerini gönderin.' });
    }

    const { data, error } = await supabase
      .from('user_books')
      .update({ progress_pages: progress_pages })
      .eq('id', userBookId) // Artık buraya sayı olarak gelecek
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    
    if (!data) {
        return res.status(404).json({ message: 'Güncellenecek kitap bulunamadı veya bu kitaba yetkiniz yok.' });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Kitap ilerlemesi güncellenirken bir hata oluştu.', error });
  }
};

//Kitap silme işlemi

/**
 * @desc   Bir kullanıcının kütüphanesinden bir kitabı siler.
 * @route  DELETE /api/books/:userBookId
 * @access Private
 */
export const deleteBookFromLibrary = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id; // Giriş yapmış kullanıcının ID'si
    
    // Geçen seferki dersten öğrendiğimiz gibi, string'i sayıya çevirelim!
    const userBookId = parseInt(req.params.userBookId, 10);

    if (isNaN(userBookId)) {
      return res.status(400).json({ message: 'Geçersiz kitap IDsi.' });
    }

    // Veritabanından silme işlemini yap
    const { error, count } = await supabase
      .from('user_books')
      .delete()
      .eq('id', userBookId)       // Sadece bu ID'ye sahip kaydı sil
      .eq('user_id', userId);     // GÜVENLİK: Kullanıcının sadece kendi kitabını silebilmesini sağlar

    if (error) throw error;
    
    // Eğer 'count' 0 ise, silinecek bir kayıt bulunamamıştır.
    if (count === 0) {
      return res.status(404).json({ message: 'Silinecek kitap bulunamadı veya bu kitaba yetkiniz yok.' });
    }

    // Başarılı silme işleminden sonra genellikle 204 No Content durum kodu döndürülür.
    // Bu, işlemin başarılı olduğunu ama geri döndürülecek bir içerik olmadığını belirtir.
    res.status(204).send();

  } catch (error) {
    res.status(500).json({ message: 'Kitap silinirken bir hata oluştu.', error });
  }
};
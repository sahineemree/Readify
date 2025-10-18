// src/routes/booksRoutes.ts

import { Router } from 'express';
import { addBookToUserLibrary, getUserBooks, updateBookProgress, deleteBookFromLibrary } from '../controllers/booksController';
import { protect } from '../middleware/authMiddleware'; // <-- Middleware

const router = Router();

// Bu rotadan itibaren altındaki tüm rotalar artık korunacak.
// Yani bu rotalara erişmek için geçerli bir token göndermek zorunlu olacak.
router.use(protect);

// POST /api/books -> Kullanıcının kütüphanesine yeni kitap ekler
router.post('/', addBookToUserLibrary);

// GET /api/books -> Giriş yapmış kullanıcının tüm kitaplarını listeler
router.get('/', getUserBooks);

// YENİ EKLENEN ROTA: Burayı kontrol et
router.patch('/:userBookId', updateBookProgress);

// YENİ ROTA: Belirli bir kitap kaydını silmek için
router.delete('/:userBookId', deleteBookFromLibrary);

export default router;
// src/routes/authRoutes.ts

import { Router } from 'express';
import { registerUser, loginUser, logoutUser } from '../controllers/authController';

// Yeni bir router nesnesi oluştur
const router = Router();

// Rotaları ve karşılık gelen controller fonksiyonlarını tanımla
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Router'ı dışa aktar ki ana app dosyamızda kullanabilelim
export default router;
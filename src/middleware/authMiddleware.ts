import {Request , Response, NextFunction} from 'express';
import {supabase} from '../config/supabaseClient';

// Express'in Request nesnesine user özelliği eklemek için
// Bu sayede controller içinde req.user diyerek kullanıcıya erişebiliriz
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  // 1. İstek başlıklarında (headers) 'Authorization' var mı diye kontrol et
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Yetkilendirme başarısız: Token bulunamadı.' });
  }

  // 2. "Bearer <token>" yapısından token'ı ayıkla
  const token = authHeader.split(' ')[1];

  // 3. Supabase'e bu token'ın geçerli olup olmadığını sor
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ message: 'Yetkilendirme başarısız: Token geçersiz.' });
  }

  // 4. Token geçerliyse, kullanıcı bilgisini isteğe (request) ekle
  req.user = user;

  // 5. Her şey yolundaysa, bir sonraki adıma (yani asıl controller fonksiyonuna) geç
  next();
};
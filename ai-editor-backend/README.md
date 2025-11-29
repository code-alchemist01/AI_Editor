# Backend - AI Editor

Express.js tabanlı backend servisi. PostgreSQL ve Gemini API ile çalışır.

## Kurulum

```bash
npm install
```

## Ortam Değişkenleri

Proje klasöründe `.env` dosyası oluşturun:

```env
# PostgreSQL Bağlantı String'i
DATABASE_URL=Host=localhost;Port=5432;Database=ai_editor_new;Username=postgres;Password=123456;

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Server Port (opsiyonel, varsayılan: 3001)
PORT=3001
```

## Veritabanı Kurulumu

Migration'ları çalıştırın:

```bash
npm run migrate
```

Bu komut `database/migrations/` klasöründeki tüm SQL dosyalarını sırayla çalıştırır.

## Geliştirme

```bash
npm run dev
```

Backend `http://localhost:3001` adresinde çalışacak.

## Production

```bash
npm run build
npm start
```

## API Endpoints

- `POST /api/chat/message` - Chat mesajı gönder
- `GET /api/conversations` - Konuşmaları listele
- `POST /api/conversations` - Yeni konuşma oluştur
- `GET /api/files` - Dosyaları listele
- `POST /api/files` - Dosya yükle
- `POST /api/files/analyze/multiple` - Çoklu dosya analizi
- `POST /api/error-analysis/analyze` - Hata analizi
- `POST /api/code-tools/refactor` - Kod refactoring


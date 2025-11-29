# 🤖 AI Kod Editörü

Kod yazarken yanınızda bir asistan olsun ister misiniz? Gemini AI ile çalışan bu editör, kodunuzu analiz eder, hatalarınızı bulur, refactoring yapar ve testler yazar.

## Özellikler

**💬 Chat** - AI ile sohbet edin, kod hakkında sorular sorun  
**📁 Dosya Analizi** - Tek/çoklu dosya yükleme ve detaylı analiz  
**🔧 Kod Araçları** - Refactoring ve mimari analiz  
**🐛 Hata Analizi** - Hata mesajlarından çözüm bulun  
**🧪 Yazılım Testi** - Projenizi tarayın, potansiyel sorunları görün  
**📝 Kod Review** - Profesyonel kod incelemesi ve öneriler  
**⚡ Performans Analizi** - Kod performansını optimize edin  
**🔒 Güvenlik Taraması** - Güvenlik açıklarını tespit edin  
**🧪 Test Üretimi** - Otomatik test case'leri oluşturun  
**📚 Dokümantasyon** - Otomatik dokümantasyon üretimi  
**🚀 Proje Üretimi** - Yeni proje için klasör yapısı oluşturun

## Hızlı Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL
- Gemini API Key ([Google AI Studio](https://aistudio.google.com/)'dan alabilirsiniz)

### Adımlar

**1. Backend**
```bash
cd ai-editor-backend
npm install
```

`.env` dosyası oluşturun:
```env
DATABASE_URL=Host=localhost;Port=5432;Database=ai_editor_new;Username=postgres;Password=123456;
GEMINI_API_KEY=your_api_key_here
PORT=3001
```

Migration çalıştırın:
```bash
npm run migrate
```

Backend'i başlatın:
```bash
npm run dev
```

**2. Frontend**

Yeni terminal:
```bash
cd ai-editor-frontend
npm install
```

`.env.local` dosyası:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Frontend'i başlatın:
```bash
npm run dev
```

**3. Açın**

Tarayıcıda `http://localhost:3000` adresine gidin.

## Nasıl Çalışır?

1. **Dosya yükleyin** - Tek dosya veya klasör halinde (tüm tab'larda desteklenir)
2. **Analiz seçin** - 11 farklı özellikten istediğinizi seçin
3. **Sonuçları görün** - Detaylı raporlar, öneriler ve çözümler alın

### Özellikler

- **Dosya Seçimi**: Tüm tab'larda yüklediğiniz dosyalardan seçim yapabilirsiniz
- **Klasör Desteği**: Klasör yüklediğinizde tüm dosyalar otomatik analiz edilir
- **Markdown Çıktı**: Tüm sonuçlar güzel formatlanmış Markdown olarak görüntülenir
- **Otomatik Scroll**: Sonuçlar geldiğinde sayfa otomatik olarak kayar

## Detaylar

- **Backend README**: `ai-editor-backend/README.md`
- **Frontend README**: `ai-editor-frontend/README.md`


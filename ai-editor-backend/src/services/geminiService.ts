import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { CreatorMode, ModelConfig, AttachedFile } from '../types';
import { GEMINI_API_KEY, DEFAULT_MODEL } from '../config/gemini';

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private currentModel: string = DEFAULT_MODEL;

  constructor() {
    if (GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    }
  }

  private getModelForMode(mode: CreatorMode, config?: ModelConfig): string {
    // If thinking is enabled, we MUST use a model that supports it
    if (config?.thinkingBudget && config.thinkingBudget > 0) {
      return 'gemini-2.5-flash';
    }

    // If search is enabled, we need a model capable of tools
    if (config?.useSearch) {
      return 'gemini-2.5-flash';
    }

    switch (mode) {
      case CreatorMode.ARCHITECTURE:
      case CreatorMode.PROJECT_GEN:
      case CreatorMode.SECURITY_SCAN:
      case CreatorMode.MULTI_FILE:
        return 'gemini-2.5-flash';
      default:
        return 'gemini-2.5-flash';
    }
  }

  private getModel(modelName?: string) {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }
    const model = modelName || this.currentModel;
    return this.genAI.getGenerativeModel({ 
      model,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }

  async generateCodeResponse(userPrompt: string, mode: CreatorMode = CreatorMode.CHAT): Promise<{ success: boolean; text: string }> {
    try {
      const isDocumentation = userPrompt.toLowerCase().includes('dokümantasyon') || 
                             userPrompt.toLowerCase().includes('documentation');

      let expertPrompt: string;
      
      if (isDocumentation) {
        expertPrompt = `Sen uzman bir teknik yazarsın ve kod dokümantasyonu konusunda uzmansın. Görevin verilen kodu analiz edip anlaşılır, kullanıcı dostu dokümantasyon oluşturmak.

DOKÜMANTASYON PRENSİPLERİN:
1. Teknik jargon yerine anlaşılır dil kullan
2. Örneklerle açıkla
3. Adım adım kılavuzlar hazırla
4. Görsel düzen için markdown formatı kullan
5. Kullanıcının seviyesine uygun açıklamalar yap

KULLANICI İSTEĞİ:
${userPrompt}

Lütfen bu isteği karşılarken, kod hakkında sadece teknik detaylar vermek yerine, kullanıcının kodu nasıl kullanabileceği, ne işe yaradığı ve nasıl çalıştığı hakkında pratik bilgiler ver.`;
      } else {
        expertPrompt = `Sen uzman bir AI kod editörüsün. Görevin kullanıcının isteklerine göre en iyi kodu yazmak ve kod problemlerini çözmek.

UZMANLIK ALANLARIN:
- Python, JavaScript, TypeScript, Java, C#, C++, Go, Rust, PHP
- Web geliştirme (React, Vue, Angular, Node.js, Django, Flask)
- Mobil geliştirme (React Native, Flutter, Swift, Kotlin)
- Veritabanı (SQL, NoSQL, ORM'ler)
- DevOps ve Cloud (Docker, Kubernetes, AWS, Azure, GCP)
- Makine öğrenmesi ve AI
- Algoritma ve veri yapıları

YANIT KURALLARIN:
1. Her zaman çalışan, temiz ve optimize kod yaz
2. Kod açıklamalarını Türkçe yap
3. Best practice'leri takip et
4. Güvenlik açıklarına dikkat et
5. Performance optimizasyonu yap
6. Error handling ekle
7. Gerekirse test kodları da yaz

KULLANICI İSTEĞİ:
${userPrompt}

Lütfen bu isteği en profesyonel şekilde karşıla ve detaylı açıklamalarla birlikte kod örnekleri ver.`;
      }

      const model = this.getModel(this.getModelForMode(mode));
      const result = await model.generateContent(expertPrompt);
      const response = await result.response;
      const text = response.text();

      return { success: true, text };
    } catch (error: any) {
      return { success: false, text: `Yanıt üretme hatası: ${error.message}` };
    }
  }

  async generateModularRefactoring(
    codeContent: string,
    refactoringType: string = 'auto',
    fileName: string = ''
  ): Promise<{ success: boolean; text: string }> {
    try {
      const refactoringPrompt = `Sen uzman bir yazılım mimarısı ve kod danışmanısın. Görevin verilen kodu analiz edip kullanıcıya modüler yapıya dönüştürme konusunda pratik rehberlik etmek.

REFACTORING TİPİ: ${refactoringType}
DOSYA ADI: ${fileName}

YAKLAŞIMIN:
- Açıklayıcı metinler ağırlıklı olsun ama teknik detayları da dahil et
- Anlaşılır dil kullan, gerektiğinde teknik terimleri açıkla
- Pratik adımlar ve öneriler ver
- Kod örnekleri minimal ama öğretici olsun
- Neden bu değişikliklerin gerekli olduğunu açıkla

ANALİZ EDİLECEK KOD:
${codeContent}

Lütfen kodu analiz ederken açıklayıcı metinleri ağırlıklı tut ama teknik detayları da dengeli şekilde ekle. Kullanıcı hem anlasın hem de teknik derinliği görsün.`;

      const model = this.getModel();
      const result = await model.generateContent(refactoringPrompt);
      const response = await result.response;
      const text = response.text();

      return { success: true, text };
    } catch (error: any) {
      return { success: false, text: `Modüler refactoring hatası: ${error.message}` };
    }
  }

  async generateArchitectureAnalysis(
    codeContent: string,
    analysisType: string = 'full',
    analysisDepth: string = 'medium'
  ): Promise<{ success: boolean; text: string }> {
    try {
      const analysisPrompt = `Sen uzman bir yazılım mimarısı ve kod danışmanısın. Görevin verilen kodu kullanıcı dostu bir şekilde analiz edip pratik öneriler sunmak.

ANALİZ TİPİ: ${analysisType}
ANALİZ DERİNLİĞİ: ${analysisDepth}

YAKLAŞIMIN:
- Teknik terimler yerine anlaşılır açıklamalar kullan
- Somut örneklerle açıkla
- Pratik çözümler öner
- Adım adım rehberlik et
- Kullanıcının seviyesine uygun dil kullan
- Markdown formatını doğru kullan

YAPILACAK ANALİZLER:
1. Kod Yapısı ve Organizasyon
2. Kod Kalitesi ve Okunabilirlik  
3. Performans ve Verimlilik
4. Güvenlik ve Hata Yönetimi
5. Test Edilebilirlik
6. Geliştirilebilirlik
7. Bakım ve Sürdürülebilirlik

ANALİZ EDİLECEK KOD:
${codeContent}

Lütfen kodu analiz ederken kullanıcının anlayabileceği bir dil kullan ve pratik, uygulanabilir öneriler sun. Markdown formatını doğru kullan ve kod blokları yerine açıklayıcı metinler tercih et.`;

      const model = this.getModel();
      const result = await model.generateContent(analysisPrompt);
      const response = await result.response;
      const text = response.text();

      return { success: true, text };
    } catch (error: any) {
      return { success: false, text: `Mimari analiz hatası: ${error.message}` };
    }
  }

  async generateErrorAnalysis(
    codeContent: string,
    errorMessage: string,
    programmingLanguage: string = 'auto'
  ): Promise<{ success: boolean; text: string }> {
    try {
      const errorAnalysisPrompt = `Sen deneyimli bir yazılım geliştirici ve hata ayıklama uzmanısın. Verilen kod ve hata mesajını analiz ederek kapsamlı bir hata analizi raporu hazırla.

YAKLAŞIMIN:
- Anlaşılır ve pratik açıklamalar yap
- Teknik terimleri açıkla
- Adım adım çözüm önerileri sun
- Benzer hataları önleme yollarını belirt

KOD:
\`\`\`
${codeContent}
\`\`\`

HATA MESAJI:
${errorMessage}

PROGRAMLAMA DİLİ: ${programmingLanguage}

Lütfen kapsamlı bir analiz raporu hazırla.`;

      const model = this.getModel();
      const result = await model.generateContent(errorAnalysisPrompt);
      const response = await result.response;
      const text = response.text();

      return { success: true, text };
    } catch (error: any) {
      return { success: false, text: `Hata analizi hatası: ${error.message}` };
    }
  }

  async generateErrorAnalysisFromFiles(
    errorMessage: string,
    uploadedFiles: AttachedFile[],
    language: string = 'auto'
  ): Promise<{ success: boolean; text: string }> {
    try {
      const filesContext = uploadedFiles
        .map(file => `### DOSYA ADI: ${file.name}\n\n\`\`\`\n${file.content}\n\`\`\``)
        .join('\n\n');

      const prompt = `Sen uzman bir yazılım geliştirici ve hata ayıklama (debugging) asistanısın.
Sana bir hata mesajı (traceback) ve projedeki birden fazla dosyanın içeriğini vereceğim.

GÖREVİN:
1. İlk olarak, verilen HATA MESAJINI dikkatlice analiz et. Hatanın hangi dosyada ve hangi satırda olduğunu tespit et.
2. Ardından, sana verdiğim PROJE DOSYALARI arasından bu dosyayı bul.
3. Hata mesajındaki bilgiler ışığında, o dosyadaki ilgili kod bölümünü incele.
4. Hatanın temel nedenini açık ve anlaşılır bir şekilde açıkla.
5. Bu hatayı gidermek için bir çözüm önerisi sun.
6. Son olarak, hatanın düzeltilmiş halini içeren tam kod bloğunu (fonksiyon veya sınıf) sun.

İşte veriler:

--- HATA MESAJI ---
${errorMessage}
--- BİTTİ ---

--- PROJE DOSYALARI ---
${filesContext}
--- BİTTİ ---

Lütfen analizini ve çözümünü Markdown formatında düzenli bir rapor olarak sun.`;

      // Validate prompt size
      if (prompt.length > 1000000) {
        return { 
          success: false, 
          text: 'Dosyalar çok büyük. Lütfen daha az dosya veya daha küçük dosyalar seçin.' 
        };
      }

      const model = this.getModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return { success: true, text };
    } catch (error: any) {
      console.error('generateErrorAnalysisFromFiles error:', error);
      const errorMessage = error.message || 'Bilinmeyen hata';
      return { 
        success: false, 
        text: `Hata analizi hatası: ${errorMessage}. Dosyalar çok büyük olabilir veya API limiti aşılmış olabilir.` 
      };
    }
  }

  async generateFileErrorPreviewAnalysis(
    uploadedFiles: AttachedFile[],
    analysisDepth: string = 'Orta (Detaylı Analiz)',
    errorFocus: string = 'Tüm Hata Türleri'
  ): Promise<{ success: boolean; text: string }> {
    try {
      const filesContext = uploadedFiles
        .map(file => `### DOSYA ADI: ${file.name}\n\n\`\`\`\n${file.content}\n\`\`\``)
        .join('\n\n');

      const depthInstructions: Record<string, string> = {
        'Hızlı (Temel Hatalar)': 'Sadece kritik hataları ve syntax hatalarını tespit et.',
        'Orta (Detaylı Analiz)': 'Temel hatalar + mantıksal hatalar + performans sorunlarını tespit et.',
        'Kapsamlı (Tüm Potansiyel Sorunlar)': 'Tüm hata türleri, kod kalitesi sorunları, güvenlik açıkları ve iyileştirme önerilerini kapsamlı şekilde analiz et.'
      };

      const focusInstructions: Record<string, string> = {
        'Tüm Hata Türleri': 'Tüm türde hataları analiz et.',
        'Temel Tüm Hata Türleri': 'Temel tüm hata kategorilerini analiz et: syntax, mantıksal hatalar, güvenlik riskleri ve performans sorunları.',
        'Sadece Kritik Hatalar': 'Sadece uygulamanın çalışmasını engelleyen kritik hatalara odaklan.',
        'Güvenlik Açıkları': 'Güvenlik açıkları, SQL injection, XSS, güvensiz kütüphane kullanımı gibi güvenlik risklerine odaklan.',
        'Performans Sorunları': 'Yavaş algoritmalar, gereksiz döngüler, bellek sızıntıları gibi performans sorunlarına odaklan.'
      };

      const prompt = `Sen uzman bir yazılım geliştirici ve kod analizi uzmanısın. Görevin, verilen tüm proje dosyalarını analiz ederek hataların hangi dosyadan başladığını, nereye yayıldığını ve çözümlerini kapsamlı ama ÖZ bir şekilde sunmaktır.

ÖNEMLİ: Bu analiz SADECE aşağıda gönderilen dosyalara dayanmalıdır. Önceki konuşmalardan, cache'den, ön belleğe kaydedilmiş çıkarımlardan veya başka kaynaklardan HİÇBİR BİLGİ KULLANMA. Her analiz tamamen bağımsız ve yeni olmalıdır. Sadece bu prompt ile gönderilen dosyaları analiz et.

ANALİZ DERİNLİĞİ: ${analysisDepth}
HATA ODAKLI ANALİZ: ${errorFocus}

DERİNLİK TALİMATLARI: ${depthInstructions[analysisDepth] || 'Orta seviye analiz yap.'}
ODAK TALİMATLARI: ${focusInstructions[errorFocus] || 'Tüm hata türlerini analiz et.'}

KURALLAR:
- SADECE AŞAĞIDA GÖNDERİLEN DOSYALARI ANALİZ ET.
- Önceki konuşmalardan, cache'den veya ön bellekten bilgi kullanma.
- Başka dosyalardan veya kaynaklardan bilgi kullanma.
- Sadece bu prompt ile gönderilen dosyalardan analiz yap.
- TÜM dosyaları analiz et ve API tarafında değerlendir.
- SADECE hata bulunan dosyaları rapora dahil et.
- Hata içermeyen dosyaları raporda GÖSTERME.

PROJE DOSYALARI (SADECE BU DOSYALARI ANALİZ ET):
${filesContext}

Lütfen kapsamlı bir hata önizleme raporu oluştur.`;

      // Validate prompt size (Gemini has token limits)
      if (prompt.length > 1000000) { // ~250k tokens
        return { 
          success: false, 
          text: 'Dosyalar çok büyük. Lütfen daha az dosya veya daha küçük dosyalar seçin.' 
        };
      }

      const model = this.getModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return { success: true, text };
    } catch (error: any) {
      console.error('generateFileErrorPreviewAnalysis error:', error);
      const errorMessage = error.message || 'Bilinmeyen hata';
      return { 
        success: false, 
        text: `Analiz hatası: ${errorMessage}. Dosyalar çok büyük olabilir veya API limiti aşılmış olabilir.` 
      };
    }
  }

  async generateFileErrorAnalysis(
    fileContent: string,
    fileName: string,
    programmingLanguage: string = 'auto'
  ): Promise<{ success: boolean; text: string }> {
    try {
      const fileAnalysisPrompt = `Sen deneyimli bir kod gözden geçirme (code review) uzmanısın ve statik kod analizi konusunda uzmansın. Görevin, verilen kaynak kodu proaktif bir şekilde analiz ederek potansiyel hataları, güvenlik açıklarını, performans sorunlarını ve kodlama standartlarına aykırılıkları tespit etmektir.

DOSYA ADI: ${fileName}
PROGRAMLAMA DİLİ: ${programmingLanguage}

ANALİZ EDİLECEK DOSYA İÇERİĞİ:
\`\`\`
${fileContent}
\`\`\`

Lütfen kapsamlı bir analiz raporu oluştur.`;

      const model = this.getModel();
      const result = await model.generateContent(fileAnalysisPrompt);
      const response = await result.response;
      const text = response.text();

      return { success: true, text };
    } catch (error: any) {
      return { success: false, text: `Dosya hata analizi hatası: ${error.message}` };
    }
  }

  async generateProjectStructure(
    projectDescription: string,
    projectType: string = 'web',
    techStack: string = '',
    projectScale: string = 'medium'
  ): Promise<{ success: boolean; text: string }> {
    try {
      const structurePrompt = `Sen bir yazılım mimarısın. Verilen proje için klasör yapısı oluştur.

PROJE TİPİ: ${projectType}
TEKNOLOJİ: ${techStack || 'Modern web stack'}
ÖLÇEK: ${projectScale}
AÇIKLAMA: ${projectDescription}

GÖREV: Sadece aşağıdaki formatı kullanarak proje yapısını göster. BAŞKA HİÇBİR ŞEY YAZMA! 

\`\`\`
project-name/
├── src/
│   ├── api/
│   └── components/
├── config/
├── README.md
└── package.json
\`\`\`

KURALLAR:
- Tree karakterleri kullan: ├── └── │
- Sadece klasör ve dosya isimlerini göster
- Açıklama, yorum veya ek metin YOK
- Code block dışında hiçbir şey yazma

SADECE CODE BLOCK İÇİNDE TREE YAPISINI OLUŞTUR!`;

      const model = this.getModel();
      const result = await model.generateContent(structurePrompt);
      const response = await result.response;
      let text = response.text();

      // Extract only the code block content if it exists
      const codeBlockMatch = text.match(/```[\s\S]*?```/);
      if (codeBlockMatch) {
        // Remove the ``` markers and get clean tree structure
        text = codeBlockMatch[0].replace(/```/g, '').trim();
      } else {
        // If no code block, try to extract tree-like structure
        const lines = text.split('\n');
        const treeLines: string[] = [];
        let inTree = false;
        
        for (const line of lines) {
          // Detect tree structure lines (containing ├── └── │ or similar)
          if (line.match(/[├└│]/) || line.match(/^[\s\-\w\/\.]+$/)) {
            inTree = true;
            treeLines.push(line);
          } else if (inTree && line.trim() === '') {
            // Stop at first empty line after tree starts
            break;
          }
        }
        
        if (treeLines.length > 0) {
          text = treeLines.join('\n');
        }
      }

      return { success: true, text };
    } catch (error: any) {
      return { success: false, text: `Proje yapısı oluşturma hatası: ${error.message}` };
    }
  }

  async generateCodeReview(
    codeContent: string,
    fileName: string = ''
  ): Promise<{ success: boolean; text: string }> {
    try {
      const reviewPrompt = `Sen deneyimli bir senior yazılım geliştirici ve kod review uzmanısın. Verilen kodu detaylı bir şekilde incele ve kapsamlı bir kod review raporu hazırla.

DOSYA ADI: ${fileName || 'Bilinmiyor'}

YAPILACAK İNCELEMELER:
1. Kod Kalitesi ve Standartlar
2. Best Practices Uyumluluğu
3. Hata Yönetimi ve Edge Case'ler
4. Güvenlik Açıkları
5. Performans İyileştirmeleri
6. Kod Tekrarı ve DRY Prensipleri
7. Okunabilirlik ve Bakım Kolaylığı
8. Test Edilebilirlik

İNCELENECEK KOD:
${codeContent}

Lütfen her bir konuyu detaylıca analiz et, öneriler sun ve örnekler ver. Markdown formatını kullan ve açıklayıcı bir rapor hazırla.`;

      const model = this.getModel();
      const result = await model.generateContent(reviewPrompt);
      const response = await result.response;
      const text = response.text();

      return { success: true, text };
    } catch (error: any) {
      return { success: false, text: `Kod review hatası: ${error.message}` };
    }
  }

  async generatePerformanceAnalysis(
    codeContent: string,
    fileName: string = ''
  ): Promise<{ success: boolean; text: string }> {
    try {
      const performancePrompt = `Sen bir performans optimizasyon uzmanısın. Verilen kodu performans açısından detaylı analiz et ve iyileştirme önerileri sun.

DOSYA ADI: ${fileName || 'Bilinmiyor'}

ANALİZ EDİLECEK KONULAR:
1. Algoritma Karmaşıklığı (Big O)
2. Bellek Kullanımı
3. Veritabanı Sorguları ve Optimizasyon
4. Döngü ve İterasyon Optimizasyonları
5. Cache Stratejileri
6. Asenkron İşlemler
7. Gereksiz Hesaplamalar
8. Bottleneck'ler

ANALİZ EDİLECEK KOD:
${codeContent}

Her bir performans sorununu tespit et, önceliklendir ve somut çözüm önerileri sun. Markdown formatında detaylı bir performans analiz raporu hazırla.`;

      const model = this.getModel();
      const result = await model.generateContent(performancePrompt);
      const response = await result.response;
      const text = response.text();

      return { success: true, text };
    } catch (error: any) {
      return { success: false, text: `Performans analizi hatası: ${error.message}` };
    }
  }

  async generateSecurityScan(
    codeContent: string,
    fileName: string = ''
  ): Promise<{ success: boolean; text: string }> {
    try {
      const securityPrompt = `Sen bir siber güvenlik uzmanısın. Verilen kodu güvenlik açısından detaylı analiz et ve güvenlik açıklarını tespit et.

DOSYA ADI: ${fileName || 'Bilinmiyor'}

TARANACAK GÜVENLİK KONULARI:
1. SQL Injection
2. XSS (Cross-Site Scripting)
3. CSRF (Cross-Site Request Forgery)
4. Authentication ve Authorization Hataları
5. Input Validation Eksiklikleri
6. Sensitive Data Exposure
7. Insecure Dependencies
8. API Güvenliği
9. Cryptography Hataları
10. Logging ve Monitoring Eksiklikleri

TARANACAK KOD:
${codeContent}

Her bir güvenlik açığını öncelik seviyesiyle (Yüksek, Orta, Düşük) belirle, açıkla ve çözüm önerileri sun. Markdown formatında detaylı bir güvenlik raporu hazırla.`;

      const model = this.getModel();
      const result = await model.generateContent(securityPrompt);
      const response = await result.response;
      const text = response.text();

      return { success: true, text };
    } catch (error: any) {
      return { success: false, text: `Güvenlik taraması hatası: ${error.message}` };
    }
  }

  async generateTestCases(
    codeContent: string,
    fileName: string = '',
    testType: string = 'unit'
  ): Promise<{ success: boolean; text: string }> {
    try {
      const testPrompt = `Sen bir test mühendisi uzmanısın. Verilen kod için kapsamlı test case'leri oluştur.

DOSYA ADI: ${fileName || 'Bilinmiyor'}
TEST TİPİ: ${testType}

OLUŞTURULACAK TESTLER:
1. Unit Testler (Fonksiyon bazlı)
2. Integration Testler
3. Edge Case Testleri
4. Error Handling Testleri
5. Performance Testleri
6. Security Testleri

TEST EDİLECEK KOD:
${codeContent}

Her test için açıklama, beklenen sonuç ve örnek test kodları hazırla. Markdown formatında detaylı bir test planı oluştur.`;

      const model = this.getModel();
      const result = await model.generateContent(testPrompt);
      const response = await result.response;
      const text = response.text();

      return { success: true, text };
    } catch (error: any) {
      return { success: false, text: `Test üretimi hatası: ${error.message}` };
    }
  }

  async generateDocumentation(
    codeContent: string,
    fileName: string = '',
    docType: string = 'api'
  ): Promise<{ success: boolean; text: string }> {
    try {
      const docPrompt = `Sen bir teknik yazar uzmanısın. Verilen kod için kapsamlı ve anlaşılır dokümantasyon oluştur.

DOSYA ADI: ${fileName || 'Bilinmiyor'}
DOKÜMANTASYON TİPİ: ${docType}

DOKÜMANTASYON İÇERİĞİ:
1. Genel Açıklama ve Amaç
2. Kurulum ve Kullanım
3. API Referansı (eğer varsa)
4. Fonksiyon/Method Açıklamaları
5. Parametreler ve Dönüş Değerleri
6. Örnekler ve Kullanım Senaryoları
7. Notlar ve Önemli Bilgiler

DOKÜMANTE EDİLECEK KOD:
${codeContent}

Anlaşılır, örneklerle dolu ve kullanıcı dostu bir dokümantasyon hazırla. Markdown formatını kullan.`;

      const model = this.getModel();
      const result = await model.generateContent(docPrompt);
      const response = await result.response;
      const text = response.text();

      return { success: true, text };
    } catch (error: any) {
      return { success: false, text: `Dokümantasyon üretimi hatası: ${error.message}` };
    }
  }

  async generateStreaming(
    prompt: string,
    mode: CreatorMode = CreatorMode.CHAT,
    config?: ModelConfig
  ): Promise<AsyncGenerator<string, void, unknown>> {
    const model = this.getModel(this.getModelForMode(mode, config));
    const result = await model.generateContentStream(prompt);

    async function* streamGenerator() {
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        yield chunkText;
      }
    }

    return streamGenerator();
  }
}

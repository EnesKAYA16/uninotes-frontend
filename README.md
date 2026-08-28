# UniNotes — Frontend

Davet kodu ile girilen, ekibe özel ders notu arşivinin arayüzü. React + TypeScript + Vite + Tailwind CSS v4 ile yazıldı; canlı backend'e doğrudan bağlanır ve Vercel'de statik olarak yayınlanır.

## Özellikler

- Davet kodu ile kayıt, e-posta/şifre ile giriş (JWT `localStorage`'da)
- Sürükle-bırak dosya yükleme (PDF ve fotoğraf, en fazla 20 MB, yükleme yüzdesi ile)
- Yüklenen notların içinde yazım toleranslı arama
- Dosya ızgarası, OCR durum rozetleri (İşleniyor / Aranabilir / İşlenemedi)
- Oturum süresi dolduğunda veya token geçersizse otomatik çıkış
- Mobil öncelikli, tamamen duyarlı arayüz

## Kurulum

```bash
npm install
npm run dev        # http://localhost:5173
```

Backend adresi `.env` ile değiştirilebilir (varsayılan canlı backend'dir):

```bash
cp .env.example .env
# VITE_API_BASE_URL=https://uninotes-7eql.onrender.com
```

Diğer komutlar:

```bash
npm run build      # tsc + üretim derlemesi (dist/)
npm run preview    # derlemeyi yerelde sun
npm run typecheck  # yalnızca tip kontrolü
```

## Vercel'e yayınlama

1. Bu klasörü kendi GitHub reposuna push edin.
2. Vercel'de **New Project → Import** ile repoyu seçin. Framework otomatik olarak *Vite* algılanır (build: `npm run build`, output: `dist`).
3. **Environment Variables** bölümüne `VITE_API_BASE_URL = https://uninotes-7eql.onrender.com` ekleyin.
4. Deploy edin. Uygulama istemci tarafı yönlendirme kullanmadığı için ek `vercel.json` gerekmez.

## Backend sözleşmesi

Tüm ağ erişimi tek bir dosyada toplanmıştır: `src/lib/api.ts`. Yeni bir uç eklemek için yalnızca bu dosyaya dokunmak yeterlidir.

| Uç | Kullanım |
|---|---|
| `POST /auth/register` `{email, password, inviteCode}` | Kayıt — `201 {user, token}` |
| `POST /auth/login` `{email, password}` | Giriş — `200 {message, token}` |
| `GET /documents` | Dosya listesi — `200 {documents: [...]}` |
| `POST /documents/upload` (multipart, alan adı `file`) | Yükleme — `201 {document}`, aynı dosya için `409` |
| `GET /documents/search?q=` | Arama — `200 {results: [...]}` |

Dikkat edilen noktalar:

- **`/auth/login` `user` nesnesi döndürmüyor** (API dokümanında vaat edilmesine rağmen). Kullanıcının e-postası bu yüzden JWT payload'ından okunuyor: `src/lib/jwt.ts`. Backend ileride `user` döndürmeye başlarsa `signIn(token, user)` çağrısı bunu doğrudan kullanır, değişiklik gerekmez.
- **JWT ömrü 1 saat.** Token'ın `exp` değeri hem açılışta hem de bir zamanlayıcı ile izleniyor; süre dolduğunda kullanıcı bilgilendirilerek giriş ekranına alınıyor.
- **`GET /documents` yoksa arayüz çökmez.** `listDocuments()` 404 alırsa `null` döner ve ızgara yalnızca o oturumda yüklenen dosyaları gösterir, üstünde bir bilgi şeridi çıkar. Uç yayına alındığında hiçbir kod değişikliği gerekmeden devreye girer.
- **Hata mesajları Türkçeleştiriliyor.** Backend'in İngilizce mesajları (`Invalid or used invitation code.` vb.) `src/lib/api.ts` içindeki `MESSAGE_TR` tablosundan geçiyor; tanınmayan mesajlar olduğu gibi gösteriliyor, böylece yeni backend hataları sessizce yutulmuyor. Zod doğrulama mesajları zaten Türkçe geldiği için olduğu gibi ilgili alanın altına yazılıyor.
- **Render soğuk başlangıcı.** Ücretsiz Render örneği uykudayken ilk istek uzun sürüyor; 5 saniyeyi aşan isteklerde sayfanın üstünde "Sunucu uykudan uyanıyor…" şeridi çıkıyor.

## Backend durumu (29 Ağustos 2026 doğrulaması)

Canlı backend'e (`https://uninotes-7eql.onrender.com`) yeni bir hesapla bağlanıp sözleşmenin tamamı uçtan uca test edildi. **Daha önce açık olan tüm backend konuları kapandı.**

### Doğrulananlar

- **PDF metin çıkarma.** `PENDING` → `PROCESSING` → `COMPLETED` akışı ~20 saniyede tamamlanıyor, `textContent` doluyor. İki sayfalı bir PDF'te ikinci sayfanın metni de eksiksiz çıkarılıyor; Türkçe karakterler (`Yapıları`, `öğrenci`, `çünkü`, `İkinci`) bozulmadan saklanıyor.
- **Arama.** Tam eşleşme (`DERINLIKONTROL`, `Dijkstra`), Türkçe karakterli sorgular (`şeker`, `öğrenci`, `Veri Yapıları`), aksansız yazımlar (`seker`, `ogrenci` → `unaccent` sayesinde eşleşiyor), yazım hataları (`yakamz`, `YAKAMOZZ`, `matematk`, `intgral`, `Dijkstre` → `word_similarity` sayesinde eşleşiyor) ve çok kelimeli sorgular (`graf algoritmalari`, `integral ve türev`) çalışıyor. Metinde geçmeyen bir kelime (`zeplinbaloncuk`) doğru şekilde 0 sonuç veriyor — tolerans gereğinden fazla gevşek değil.
- **Silme.** `DELETE /documents/:id` → `200 Document deleted successfully!`; dosya listeden kalkıyor, R2 adresi `404` veriyor, aynı kimlikle ikinci silme `404 Document not found!` döndürüyor.
- **Login yanıtı.** `POST /auth/login` artık `{message, token, user:{id,email}}` döndürüyor.
- **Ortak arşiv.** `GET /documents` ve `/documents/search` tüm kullanıcıların dosyalarını kapsıyor.

### Arayüz tarafında yapılan düzeltmeler

Backend'in yeni davranışlarına uyum sağlamak için üç değişiklik yapıldı ve headless Chrome ile canlı backend'e karşı doğrulandı:

- **`PROCESSING` durumu tanınıyor.** Backend dosyayı `PENDING` → `PROCESSING` → `COMPLETED` sırasıyla ilerletiyor. `DocumentStatus` bu değeri içeriyor, `isProcessing()` yardımcısı ikisini birlikte ele alıyor, rozet "Sırada" / "İşleniyor" ayrımını gösteriyor ve otomatik yenileme (`AppShell`) artık `PROCESSING` için de çalışıyor. Önceden dosya listeye `PROCESSING` olarak düştüğünde yoklama hiç başlamıyor ve rozet elle yenilenene kadar takılı kalıyordu.
- **Silme.** `deleteDocument()` eklendi; kartlardaki silme butonu iki adımlı çalışıyor (ilk tıklama "Emin misiniz?" durumuna geçiyor, 4 saniye sonra kendiliğinden iptal oluyor). Silinen dosya hem listeden hem arama sonuçlarından düşüyor; başka biri aynı dosyayı önce silmişse (`404`) hata yerine bilgi mesajı gösteriliyor. Arşiv ortak olduğu için kart tıklama alanı ile silme butonu ayrıldı: bağlantı kartı kaplıyor, buton üstte kalıyor.
- **Login yanıtındaki `user` kullanılıyor.** `AuthScreen` artık `signIn(data.token, data.user)` çağırıyor; JWT'den çözme yolu, `user` gelmezse devreye giren yedek olarak duruyor.

Ayrıca "Dosyalarım" başlığı, ortak arşivi yansıtacak şekilde "Arşiv" oldu.

### Görsel OCR

Görsellerde (`image/*`) OCR bu turda ayrıca test edilmedi; son denemede (28 Ağustos) görseller yüklendiği anda `COMPLETED` işaretleniyor ama `textContent` boş kalıyordu.

## Yapı

```
src/
  lib/
    api.ts        Tüm uçlar, hata çevirisi, 401 yakalama, yavaş istek bildirimi
    auth.tsx      AuthContext: token saklama, JWT çözme, süre takibi
    jwt.ts        JWT payload okuyucu (imza doğrulaması yapmaz)
    format.ts     Dosya boyutu / tarih / tür etiketi biçimleme
    constants.ts  Dosya sınırları, debounce ve yoklama süreleri
  components/
    AuthScreen.tsx     Giriş / kayıt kartı
    AppShell.tsx       Üst bar, arama durumu, dosya listesi yönetimi
    UploadDropzone.tsx Sürükle-bırak, doğrulama, ilerleme
    SearchBar.tsx  SearchResults.tsx  DocumentGrid.tsx  DocumentCard.tsx
    StatusBadge.tsx  EmptyState.tsx  Toast.tsx  Spinner.tsx  icons.tsx
```

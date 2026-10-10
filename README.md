# Yggdrasil — D&D Sefer Yönetim Web Uygulaması (Companion Platform)

React 19, TypeScript, Vite, Tailwind CSS v4, React Flow (@xyflow/react), Framer Motion ve Supabase altyapısıyla geliştirilmiş karanlık fantezi (dark-fantasy) masaüstü rol yapma (TTRPG) sefer yönetim platformu.

---

## 1. Geliştirme ve Kalite Doğrulama Komutları

```powershell
# Geliştirme sunucusunu başlat
npm run dev

# Tip kontrolü ve üretim derlemesi (0 hata kuralı)
npm run build

# Katı ESLint statik kod analizi (0 hata, 0 uyarı kuralı)
npm run lint

# Üretim önizleme sunucusu
npm run preview

# Ampirik sayfa yükleme süresi benchmark testi (Playwright + FCP/DCL/Load)
node scripts/measure-load-time.mjs

# Önce/Sonra arayüz ekran görüntülerini yakalama
node scripts/capture-screenshots.mjs

# Playwright E2E testleri (Kimlik bilgileri yapılandırıldığında)
npx playwright test
```

---

## 2. Kullanıcı Canlı Veritabanı Eylem Kontrol Listesi (Live Database Action Checklist)

Uygulamanın yeni GM kontrol modülleri (Combat Tracker, Atmosphere, Loot Dispenser), güvenli envanter yuvaları ve katı RLS politikaları ile çalışabilmesi için kullanıcının canlı Supabase projesinde aşağıdaki adımları sırayla uygulaması gerekmektedir:

### 2.1 Supabase SQL Editor Migrasyon Çalıştırma Sırası

Supabase Kontrol Panelinde (**Dashboard -> SQL Editor**) sırasıyla aşağıdaki SQL dosyalarının içeriğini yapıştırıp çalıştırın (`Run`):

| Sıra | Migrasyon Dosyası | Açıklama & Kapsam | İdempotentlik Garantisi |
|:---:|---|---|:---:|
| **1** | `supabase/migrations/01_security_and_rls_hardening.sql` | `SECURITY DEFINER` anti-recursion fonksiyonları, RLS sıkılaştırma, profil rol koruması tetikleyicisi | `CREATE OR REPLACE`, `IF NOT EXISTS`, `DROP POLICY IF EXISTS` |
| **2** | `supabase/migrations/02_schema_consistency.sql` | Harita token'ları için `label`, envanter için 24 slot `slot_index`, atomik `gm_award_xp` fonksiyonu | `ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION` |
| **3** | `supabase/migrations/03_new_gm_modules.sql` | 3 Yeni GM Tablosu: `campaign_encounters` & `encounter_combatants`, `campaign_environments` & `session_chronicles`, `campaign_loot_chests` + GM-only RLS ve Realtime | `CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS` |

---

### 2.2 `01_security_and_rls_hardening.sql` Risk Analizi ve Geriye Uyumluluk (Risk Analysis)

Bu migrasyon mevcut canlı RLS politikalarını güncellediği için aşağıdaki etki ve güvenlik analizleri gerçekleştirilmiştir:

1. **42P17 (Infinite Recursion) Ortadan Kaldırılması**:
   - *Eski Durum*: `profiles` tablosuna yönelik politikalarda inline `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')` sorguları PostgreSQL'de özyinelemeli döngüye ve `42P17` çökmesine yol açıyordu.
   - *Çözüm & Güvenlik*: `public.is_admin()` ve `public.is_gm()` fonksiyonları `SECURITY DEFINER SET search_path = public` olarak tanımlanmıştır. RLS baypas edilerek rol güvenle sorgulanır.
2. **Rol Yükseltme Zafiyeti (Privilege Escalation) Engeli**:
   - *Eski Durum*: `profiles` tablosu üzerinde güncelleme politikası kolon bazlı kısıtlama içermiyordu; bir oyuncu istemciden `supabase.from('profiles').update({ role: 'admin' })` çağırarak kendini yönetici yapabiliyordu.
   - *Çözüm & Güvenlik*: `protect_profile_role` tetikleyicisi (trigger) eklenmiştir. Yalnızca mevcut rolü `admin` olan kullanıcılar başkalarının rolünü değiştirebilir; standart kullanıcıların rol kolonunu güncellemesi veritabanı seviyesinde `42501` hatasıyla engellenir.
3. **Geriye Dönük Uyumluluk (Backward Compatibility)**:
   - Mevcut oyuncuların kendi karakterlerini oluşturma (`INSERT`), görüntüleme (`SELECT`) ve güncelleme (`UPDATE`) akışları bozulmamıştır (`auth.uid() = profile_id`).
   - Sefer üyeliği (`campaign_members`) ve GM yönetim akışları kesintisiz çalışmaya devam eder.

---

### 2.3 Gerekli `.env.local` Ortam Değişkenleri

Canlı E2E testleri ve gerçek oturum doğrulamaları için proje kökünde yer alan `.env.local` dosyasında şu değişkenlerin tanımlı olması gerekir:

```bash
# Supabase Bağlantısı
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# Canlı E2E Test Hesapları (Gerçek Auth JWT İçin)
E2E_GM_EMAIL="gm-test@example.com"
E2E_GM_PASSWORD="YourStrongPassword123!"

E2E_PLAYER_EMAIL="player-test@example.com"
E2E_PLAYER_PASSWORD="YourStrongPassword123!"
```

> **ÖNEMLİ GÜVENLİK KURALI:** `.env.local` dosyası `.gitignore` kapsamındadır. Bu dosyayı asla git havuzuna eklemeyin ve kimlik bilgilerini raporlara yazmayın.

---

### 2.4 Test Hesaplarının Rollerini Tanımlama (Test Account Roles Setup)

Supabase Auth panelinde iki ayrı test kullanıcısı oluşturduktan sonra (biri GM, biri Oyuncu), SQL Editor üzerinden ilgili kullanıcıların profillerine rollerini atayın:

```sql
-- GM hesabına GM rolü atama:
UPDATE public.profiles 
SET role = 'gm' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'gm-test@example.com');

-- Oyuncu hesabına Player rolü atama:
UPDATE public.profiles 
SET role = 'player' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'player-test@example.com');
```

Bu roller atandıktan ve migrasyonlar çalıştırıldıktan sonra `npx playwright test` komutu tüm testleri gerçek Supabase JWT'leri ve PostgreSQL RLS politikaları üzerinden %100 doğrulukla koşturacaktır.

---

## 3. Raporlar ve Denetim Dokümantasyonu

Proje kapsamında hazırlanan ayrıntılı teknik raporlar:
- **`R1_AUDIT_REPORT.md`**: Mimari açıklar, güvenlik denetimi ve bozuk fonksiyonlar dökümü.
- **`R2_RESEARCH_REPORT.md`**: Yeni özellikler araştırma ve önceliklendirme raporu.
- **`R3_PERFORMANCE_AUDIT.md`**: Ampirik FCP/DCL/Load yükleme süresi ölçümleri ve bundle optimizasyon raporu.
- **`R4_UI_REVAMP_PLAN.md`**: Karanlık fantezi arayüz yenileme planı ve bağımsız rubrik inceleme raporu.
- **`TEST_READY.md`**: Katı Playwright E2E test paketi mimarisi, kimlik doğrulama hata çıktıları ve hazır bulunuşluk belgesi.
- **`docs/screenshots/README.md`**: Masaüstü ve mobil çözünürlüklerde önce/sonra ekran görüntüleri kataloğu.

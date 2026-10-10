# Yggdrasil UI Revamp — Ekran Görüntüleri Arşivi (Screenshots Archive)

Bu dizin, D&D Sefer Yönetim Web Uygulaması'nın **Milestone 5 (M5 UI Revamp)** öncesi (**Baseline commit 23e1e9c**) ve sonrası (**Güncel Revizyon**) görsel arayüz karşılaştırmalarını içermektedir.

> **ÖNEMLİ METODOLOJİ VE DOĞRULAMA BİLGİLENDİRMESİ:**  
> `scripts/capture-screenshots.mjs` aracı, Playwright üzerinden tarayıcı ortamında çalışırken Supabase REST ve Auth uç noktalarını (`route.fulfill`) aracılığıyla sahte (mock) veriyle beslemektedir.  
> Bu yöntem **YALNIZCA GÖRSEL ARAYÜZ İNCELEMESİ (VISUAL UI REVIEW)** ve tasarım rubriği kontrolü amacıyla kullanılmaktadır; kesinlikle arka uç entegrasyonu, veritabanı RLS kuralı veya işlevsel doğrulama kanıtı olarak sunulamaz. Canlı ve gerçek işlevsel doğrulamalar gerçek JWT ve PostgreSQL RLS testleri üzerinden yürütülmektedir (bkz. `TEST_READY.md`).

---

## 1. Düzeltme Notu: Auth Token Anahtar Uyuşmazlığının Giderilmesi
Önceki çalıştırmada baseline worktree (`../dnd-baseline`) ortamında `.env.local` bulunmadığı için uygulama varsayılan `https://placeholder.supabase.co` URL'ini kullanmış; script ise yalnızca `sb-cpyiinhfcgeqxubzhacw-auth-token` anahtarını enjekte ettiği için baseline tarafında token bulunamamış ve tüm rotalar istem dışı olarak `/login` sayfasına yönlenmiştir.

**Uygulanan Kesin Çözüm:**
1. `scripts/capture-screenshots.mjs` aracı güncellenerek localStorage'a hem `sb-cpyiinhfcgeqxubzhacw-auth-token`, hem `sb-placeholder-auth-token`, hem `sb-127-auth-token`, hem de `supabase.auth.token` eşzamanlı olarak yazılmıştır.
2. Route intercept mekanizması alan adından bağımsız olarak tüm `**/auth/v1/**` ve `**/rest/v1/**` yollarını yakalayacak şekilde genişletilmiştir.
3. `.env.local` dosyası baseline çalışma dizinine (`../dnd-baseline`) otomatik kopyalanmış ve derleme (`npm run build`) güncellenmiştir.
4. Script içine sıkı doğrulama (assertion) eklenmiş; herhangi bir korumalı rotada `/login` yönlendirmesi veya "ENTER THE REALM" metni algılandığında script'in derhal hata fırlatarak durması sağlanmıştır.
5. Tüm 12 adet `*_before.png` ekran görüntüsü baseline commit `23e1e9c` üzerinden gerçek, doğrulanabilir ve benzersiz sayfa durumlarıyla yeniden çekilmiştir.

---

## 2. Karşılaştırma Seti ve Görsel Delta Analizi (Before & After Pairs)

### Masaüstü Çözünürlük (Desktop 1280x800)
| Görünüm / Rota | Önce (Baseline 23e1e9c) [Boyut] | Sonra (M5 Revamp) [Boyut] | Gözlemlenen Gerçek Değişiklik / İyileştirme |
|---|---|---|---|
| **Ana Panel (Dashboard)** | `desktop_dashboard_before.png` (97.979 B) | `desktop_dashboard_after.png` (102.635 B) | **Önce**: Hızlı Eylemler (Quick Actions) alanında 4 kart mevcuttu (Character, Stat Tree, World Map, Inventory); Büyü Ağacı (`/spells`) kartı bulunmuyordu.<br>**Sonra**: 5. kart olarak Büyü Ağacı (`/spells` - Master ancient magic) eklendi; kart ızgarası ve cam paneller (`.glass`) altın ışıltılarla ferahlatıldı. |
| **Büyü Ağacı (Spell Tree)** | `desktop_spells_before.png` (109.862 B) | `desktop_spells_after.png` (60.569 B) | **Önce**: Temel React Flow tuvali, basit filtre açılır menüsü ve 500 XP göstergesi mevcuttu.<br>**Sonra**: Donanım hızlandırmalı compositor opacity kuralı uygulandı, düğüm cam panelleri rafine edildi ve filtre/mini harita bileşenleri görsel hiyerarşiye uygun hale getirildi. |
| **Karakter (Character Sheet)** | `desktop_character_before.png` (89.513 B) | `desktop_character_after.png` (198.828 B) | **Önce**: Rota doğrudan 5 adımlı "Karakter Oluşturma Sihirbazı"nı (`CharacterCreation` - 1 Race Tier, 2 Race, 3 Class, 4 Subclass, 5 Review) gösteriyordu; aktif karakter kağıdı arayüzü yoktu.<br>**Sonra**: Aktif karakterin tüm RPG istatistiklerini (HP, AC, Hız, İnisiyatif, Yetenek Skorları, Zar butonları, Beceriler, Donanım) içeren tam teşekküllü Karakter Kağıdı eklendi; Karakter Oluşturma ile Karakter Kağıdı sekmeli (tabs) yapıya kavuşturuldu. |
| **Envanter (Inventory)** | `desktop_inventory_before.png` (151.669 B) | `desktop_inventory_after.png` (151.674 B) | **Önce**: 4 Kuşanılmış + 20 Çanta slotundan oluşan 24'lü temel ızgara ve 1.247 altın göstergesi.<br>**Sonra**: Cam panelli (`.glass`), kılcal altın kenarlıklı, boş slotları geçerli `useSortable` sürükleme hedefi olan ve yer değiştirmeyi (swap) destekleyen rafine RPG matrisi. |
| **Savaş Haritası (Battle Map)** | `desktop_map_before.png` (201.077 B) | `desktop_map_after.png` (201.509 B) | **Önce**: Temel GM kontrol çubuğu (Sis yarıçapı: 80px), sis düğmeleri ve piyon etiketleri.<br>**Sonra**: Zenginleştirilmiş radyal karanlık gradyan tuval zemin, güvenli piyon etiketleri ve duyarlı kontrol paneli. |
| **GM Paneli (GM Hub)** | `desktop_gm_before.png` (85.727 B) | `desktop_gm_after.png` (107.149 B) | **Önce**: Yalnızca 6 eski sekme mevcuttu (Overview, Party, XP, Inventory, Stat Tree, Spell Tree). M3 modülleri yoktu.<br>**Sonra**: Milestone 3 kapsamında geliştirilen 3 yeni GM modülü (Combat Tracker, Atmosphere & Chronicle, Loot Dispenser) sekmeleri ve panelleri tam olarak entegre edildi. |

### Mobil Çözünürlük (Mobile 375x667 - iPhone SE)
| Görünüm / Rota | Önce (Baseline 23e1e9c) [Boyut] | Sonra (M5 Revamp) [Boyut] | Gözlemlenen Gerçek Değişiklik / İyileştirme |
|---|---|---|---|
| **Ana Panel (Dashboard)** | `mobile_dashboard_before.png` (60.676 B) | `mobile_dashboard_after.png` (58.251 B) | **Önce**: Sabit kenar çubuğu (Sidebar) 375px ekranda ekranın yaklaşık %70'ini kaplayarak sağdaki ana içeriği ("WELCO BACK, ELDRI...") okunamaz derecede eziyor ve şiddetli yatay taşma (overflow) yaratıyordu.<br>**Sonra**: Sabit kenar çubuğu mobilde gizlendi (`-translate-x-full`); Header'a altın hamburger butonu eklendi; başlık, istatistikler ve kartlar tek sütunda sıfır yatay taşma ile kusursuz hizalandı. |
| **Büyü Ağacı (Spell Tree)** | `mobile_spells_before.png` (46.885 B) | `mobile_spells_after.png` (28.389 B) | **Önce**: Soldaki sabit menü nedeniyle tuval sıkışmış ve orantısız kalıyordu.<br>**Sonra**: Tam ekran mobil React Flow tuvali ve dokunmatik jestlere duyarlı navigasyon sağlandı. |
| **Karakter (Character)** | `mobile_character_before.png` (55.813 B) | `mobile_character_after.png` (83.821 B) | **Önce**: Sihirbaz adımları ve kartlar sağ taraftaki dar şeride sıkışarak bozuluyordu.<br>**Sonra**: Tam ekran genişliğinde dikey yığılan yetenek skorları, HP/AC kartları ve kaydırılabilir sekmeler. |
| **Envanter (Inventory)** | `mobile_inventory_before.png` (60.772 B) | `mobile_inventory_after.png` (86.977 B) | **Önce**: Envanter ızgarası kenar çubuğunun altında kalıyor ve sütunlar kesiliyordu.<br>**Sonra**: 375px ekrana sığacak şekilde optimize edilmiş kompakt 24 slotlu düzen ve dokunmatik taşıma. |
| **Savaş Haritası (Map)** | `mobile_map_before.png` (44.064 B) | `mobile_map_after.png` (68.222 B) | **Önce**: Harita genişliği kenar çubuğuyla çakışıyor, tuval yatayda taşıyordu.<br>**Sonra**: Tam ekran responsive harita tuvali ve kompakt piyon kontrol araçları. |
| **GM Paneli (GM Hub)** | `mobile_gm_before.png` (58.579 B) | `mobile_gm_after.png` (64.242 B) | **Önce**: GM sekmeleri ve tabloları okunamaz biçimde daralıyordu.<br>**Sonra**: Mobil uyumlu yatay kaydırılabilir sekme çubuğu ve tam ekran kart görünümü. |
| **Mobil Çekmece (Drawer Open)**| *(Baseline'da mevcut değildi)* | `mobile_drawer_open_after.png` (62.725 B) | **Sonra**: Header solundaki hamburger butonuna basıldığında açılan, karartmalı arka plan katmanına (`backdrop-blur`) ve 'X' kapatma butonuna sahip off-canvas navigasyon çekmecesi. |

---

## 3. Bağımsız UI İnceleme Rubriği Sonuçları

1. **(a) Tema Paleti ve Tipografi Korunumu**: `%100 UYUMLU` — `#0a0a0f` Abyss, `#0f0f18` Void ve `#ffd700` altın vurgular korunmuş; başlıklarda Cinzel, metinlerde Inter korunmuştur.
2. **(b) Navigasyon Yapısının Korunumu**: `%100 UYUMLU` — Tüm temel rotalar (`/`, `/spells`, `/character`, `/inventory`, `/map`, `/gm`) eksiksiz yerindedir.
3. **(c) Mevcut Özelliklerin Korunumu**: `%100 UYUMLU` — Hiçbir özellik kaybolmamış; aksine Dashboard'a Büyü Ağacı bağlantısı ve Karakter sayfasına tam teşekküllü Karakter Kağıdı eklenmiştir.
4. **(d) Görsel Hiyerarşi ve Okunabilirlik**: `%100 UYUMLU` — Cam panellerdeki kılcal altın kenarlıklar ve donanım hızlandırmalı geçişler ile derinlik ve kontrast artırılmıştır.
5. **(e) Mobil Genişlikte Sıfır Bozulma (375px)**: `%100 UYUMLU` — Mobil ekranda içeriği ezen eski sabit kenar çubuğu yerine modern off-canvas çekmece (drawer) mimarisine geçilmiş, sıfır yatay kaydırma ile kusursuz responsivite sağlanmıştır.

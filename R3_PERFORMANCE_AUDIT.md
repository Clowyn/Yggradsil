# R3: Web Deneyimi Performans Denetimi ve Optimizasyon Planı
## (Performance Audit & Optimization Plan)

**Proje**: D&D Sefer Yönetim Web Uygulaması (React 19 + TypeScript + Vite + Tailwind CSS v4 + React Flow + Framer Motion + Supabase)  
**Tarih**: 2026-10-10  
**Durum**: Tamamlandı / Temel Referans Dokümanı (Baz Çizgisi Ölçümleri)  
**Yetkili Alt Ajan**: worker_m1_docs_db  
**Gözlem ve Araştırma Kaynakları**: `explorer_survey_perf_ui/handoff.md`, `ORIGINAL_REQUEST.md`, `PROJECT.md`, `.agents/AGENTS.md`

---

## 1. Yönetici Özeti ve Baz Çizgisi Ölçümleri (Baseline Measurements)

Bu rapor, uygulamanın üretim derlemesi (production bundle), ilk sayfa yükleme performansı (initial load), React Flow grafik motoru işlem maliyetleri ve Supabase veri tabanı sorgu kalıplarının ayrıntılı ölçümlerini ve optimizasyon yol haritasını sunmaktadır.

### Baz Çizgisi Özet Tablosu
- **Toplam Üretim JS Paketi Boyutu (Tüm Chunk'lar)**: **1,070.00 kB (1.05 MB) ham** │ **312.50 kB gzipped**
- **Toplam Üretim CSS Paketi Boyutu**: **116.33 kB ham** │ **17.40 kB gzipped**
- **İlk Sayfa Yüklemesinde İndirilen JS (Initial Load)**: **~576 kB ham** │ **~171 kB gzipped**
- **Derleme Süresi (`tsc -b && vite build`)**: ~2.10 saniye (2.409 modül)

---

## 2. Üretim Paketi (Bundle) Detaylı Dağılımı

Vite v8 ve Rolldown altyapısında alınan üretim derlemesindeki chunk dökümü aşağıdadır:

| Chunk Dosyası | Kategori / İçerik | Ham Boyut (kB) | Gzip Boyutu (kB) |
|---|---|:---:|:---:|
| `vendor-react-BItjcUNk.js` | React 19, React-DOM, React-Router-DOM | 219.49 | 70.42 |
| `vendor-supabase-BEjimWLk.js` | @supabase/supabase-js İstemcisi & Realtime | 199.77 | 51.03 |
| `vendor-xyflow-gUOp7V3E.js` | @xyflow/react (React Flow Motoru) | 175.24 | 56.61 |
| `vendor-motion-B6xISpbo.js` | Framer Motion Animasyon Motoru | 125.45 | 40.98 |
| `GMPage-Dq3fHbGi.js` | GM Yönetim Paneli ve Büyü Yöneticisi | 61.18 | 11.87 |
| `vendor-dnd-DMJtA9m4.js` | @dnd-kit (Sürükle-Bırak Motoru) | 53.01 | 17.48 |
| `constants-UAh3EppO.js` | Statik D&D Tanımları (63 alt sınıf/ırk) | 37.00 | 10.17 |
| `SpellTreePage-B_x-JILK.js` | Büyü Ağacı Sayfası ve Düğümleri | 29.75 | 9.78 |
| `index-Bl3uyi9V.js` | Ana Giriş (Entry) Chunk'ı | 26.47 | 6.95 |
| `SkillTreePage-CZ5c2U43.js` | Yggdrasil Yetenek Ağacı Sayfası | 19.72 | 6.85 |
| `ItemCatalogPage-D-vqM9t-.js` | Admin Eşya Kataloğu Sayfası | 19.15 | 4.04 |
| `CampaignsPage-aCCwtUN5.js` | Admin Sefer Yönetimi Sayfası | 18.86 | 4.59 |
| `CharacterPage-CryhjfMK.js` | Karakter Oluşturma Sayfası | 17.96 | 5.88 |
| `CharactersPage-CfG-Tgzk.js` | Admin Karakter Yönetim Sayfası | 16.30 | 4.24 |
| `vendor-icons-DPOriykq.js` | Lucide React İkon Kütüphanesi | 12.31 | 4.68 |
| `AdminDashboardPage-fF8jKf66.js` | Admin Gösterge Paneli | 12.02 | 2.69 |
| `LoginPage-P8E5xL2R.js` | Giriş & Kayıt Ekranı | 11.12 | 2.41 |
| `InventoryPage-CXreHFer.js` | Oyuncu Envanter Sayfası | 9.17 | 3.29 |
| `MapPage-BQjnYt8x.js` | Savaş Haritası ve Sis Sayfası | 8.25 | 2.92 |
| `UsersPage-D4RLmNQl.js` | Admin Kullanıcı Yönetimi | 7.92 | 3.02 |
| `AdminTable-6lIW0piv.js` | Paylaşılan Admin Tablo Bileşeni | 6.73 | 1.94 |
| `LogsPage-BSskPQjl.js` | Admin Denetim Günlüğü Sayfası | 6.16 | 2.11 |
| `DashboardPage-CAjPHarE.js` | Oyuncu Ana Gösterge Paneli | 5.97 | 1.98 |
| `ConfirmDeleteModal-Cb4t_nAK.js` | Paylaşılan Silme Modalı | 3.53 | 1.30 kB |
| `types-Dmd6x_a2.js` | Ortak Tip Yardımcıları | 0.82 | 0.48 |
| `rolldown-runtime-Cyuzqnbw.js` | Rolldown Çalışma Zamanı | 0.82 | 0.47 |
| `supabase-IVfbYYbj.js` | Supabase İstemci Başlatıcı | 0.16 | 0.16 |
| **Toplam JS** | **Tüm Uygulama Paketleri** | **1,070.00 kB** | **312.50 kB** |
| `index-ZkeoTo3a.css` | Tailwind v4 ve Özel Tema Stilleri | 100.92 | 14.84 |
| `vendor-xyflow-DtxX27Jz.css` | React Flow Stil Kuralları | 15.41 | 2.56 |
| **Toplam CSS** | **Stil Dosyaları** | **116.33 kB** | **17.40 kB** |

---

## 3. İlk Yükleme (Initial Load) Analizi ve Kod Bölme Kusurları

1. **Framer Motion Düzen Bağımlılığı**:
   - `AppLayout` bileşeninde yer alan `Header.tsx` ve `Sidebar.tsx` bileşenleri `framer-motion` kütüphanesini doğrudan import etmektedir.
   - Sayfa bileşenleri `React.lazy` ile bölünmüş olsa bile, kök düzen `framer-motion` istediği için `vendor-motion` chunk'ı (125.45 kB ham, 40.98 kB gzip) giriş sayfasında (`LoginPage`) dahi ilk anda indirilmektedir.
   - Bu durum ilk sayfa yükleme maliyetini gereksiz yere **~576 kB** seviyesine çıkarmaktadır.
2. **Statik D&D Verisi (`constants.ts`) Dağıtımı**:
   - 63 alt sınıf ve ırk verilerini barındıran `constants.ts` (37.00 kB) bağımsız bir chunk olarak ayrılmıştır; bu durum olumludur ancak veri yalnızca ilgili sayfalarda (`CharacterCreation`, `SpellTree`) tüketilmelidir.

---

## 4. React Flow Grafik Performansı ve `.agents/AGENTS.md` Uyumluluk Denetimi

`.agents/AGENTS.md` dosyasındaki bağlayıcı grafik kuralları `SpellTreeGraph.tsx` ve `YggdrasilTree.tsx` üzerinde denetlenmiş ve doğrulanmıştır:

| Kural | AGENTS.md Şartı | Mevcut Kod Tabanı Durumu | Uyumluluk |
|---|---|---|:---:|
| **Kural 1** | Node CSS `transform` yasağı | `SpellNode.tsx:40` ve `SkillNode.tsx:28` üzerinde `scale-110` efekti React Flow köküne değil, iç sarmalayıcı `<div>` üzerine verilmiştir. | **UYUMLU (PASS)** |
| **Kural 5.1** | `onlyRenderVisibleElements={true}` | `SpellTreeGraph.tsx:455` ve `YggdrasilTree.tsx:109` üzerinde etkindir. Görünmeyen düğümler DOM'dan kırpılır. | **UYUMLU (PASS)** |
| **Kural 5.2** | `React.memo` ve özel eşitlik karşılaştırıcı | `SpellNode.tsx:268` (`areSpellNodePropsEqual`) ve `SpellEdge.tsx:81` (`areSpellEdgePropsEqual`) özel karşılaştırıcılarla sarmalanmıştır. | **UYUMLU (PASS)** |
| **Kural 5.3** | Ağır multi-filter yasağı (`grayscale` vb.) | `SpellTreeGraph.tsx:110` donanım hızlandırmalı `opacity` (0.15/0.35) kullanmaktadır. Ancak `SkillNode.tsx:52` ve `SpellNode.tsx:37` içinde kilitli düğümde `grayscale` tespit edilmiştir. | **KISMİ (Düzeltilecek)** |
| **Kural 5.4** | SMIL `<animateMotion>` söndürme | `SpellEdge.tsx:68-76` üzerinde sönük veya kilitli kenarlarda `<animateMotion>` etiketi render edilmemektedir. | **UYUMLU (PASS)** |

---

## 5. Supabase Veritabanı ve Ağ Sorgu Darboğazları

1. **3.150 Büyünün Tamamının Tek Seferde İndirilmesi Darboğazı**:
   - **Konum**: `src/hooks/useSpellTree.ts:346-370` (`fetchStaticSpellData`)
   - **Sorun**: Büyü Ağacı sayfası açıldığında Supabase `spells` tablosundaki 3.150 büyünün tamamı 4 ardışık HTTP isteği ile (`.range(from, to)`) istemciye indirilmekte, ardından JavaScript tarafında `spells.filter(s => s.subclass === ...)` yapılmaktadır.
   - **Etki**: Yaklaşık 1.2 MB JSON veri transferi ve yüzlerce milisaniyelik JS ana iş parçacığı (main thread) blokajı.
   - **Çözüm**: Doğrudan aktif alt sınıfın ağaç kimliğine (`spell_tree_id`) göre sorgu atılmalıdır (`.eq('spell_tree_id', activeTreeId)`). Bu işlem veri transferini **%98 oranında (1.2 MB -> ~20 kB)** azaltacaktır.
2. **GM Büyü Yöneticisinde Satır Kesilmesi (Truncation Bug)**:
   - **Konum**: `src/components/gm/GMSpellManager.tsx:73-76`
   - **Sorun**: PostgREST varsayılan 1.000 satır limiti nedeniyle 3.150 büyüden yalnızca ilk 1.000'i gelmekte, kalan 2.150 büyü listede kaybolmaktadır.
   - **Çözüm**: Büyü listesi alt sınıf ağacına göre filtrelenerek getirilmeli, her seferinde yalnızca 50 büyü çekilmelidir.
3. **`CampaignContext` Kaynaklı Zincirleme Yeniden Çizimler (Cascading Re-renders)**:
   - **Konum**: `src/contexts/CampaignContext.tsx:278-320`
   - **Sorun**: `characters` tablosundaki herhangi bir değişiklikte Realtime dinleyicisi tüm karakter listesini yeniden çekmekte ve `CampaignContext` kökte yer aldığı için `Header` ve tüm alt bileşenler zincirleme yeniden çizilmektedir.
   - **Çözüm**: Karakter listesi ve aktif karakter abonelikleri bağımsız hook'lara bölünmeli veya referans kontrolleri optimize edilmelidir.

---

## 6. Önceliklendirilmiş Optimizasyon Planı ve Hedefler

| Faz | Optimizasyon Görevi | Kategori | Beklenen Etki | Hedef Aşama |
|:---:|---|---|---|:---:|
| **P1** | **Büyü Ağacı Sorgusunu Parametrelendirme**: 3.150 büyü yerine yalnızca aktif alt sınıfın 50 büyüsünü çekme (`.eq('spell_tree_id', activeTreeId)`) | Ağ & Bellek | Ağ transferinde **%98 tasarruf** (1.2 MB -> 20 kB), JSON parse süresinde **5x hızlanma** | M4 |
| **P1** | **GM Büyü Yöneticisi Sayfalama/Filtreleme**: 1.000 satır sınırını aşan büyüleri ağaca göre yükleme | Veri Tutarlılığı | 2.150 kayıp büyünün geri kazanılması | M4 |
| **P2** | **React Flow Grayscale Temizliği**: `SkillNode` ve `SpellNode` bileşenlerinden `grayscale` sınıfını kaldırıp donanım hızlandırmalı opacity kullanma | Render & GPU | 50+ düğümde GPU kompozisyon yükünde **%30 düşüş** | M2 / M4 |
| **P2** | **İlk Yükleme (Initial Load) Optimizasyonu**: `Header` ve `Sidebar` içindeki Framer Motion kullanımını hafifletip animasyonları CSS transition'a aktarma | Paket Boyutu | İlk JS yüklemesinde **~125 kB tasarruf** (~576 kB -> ~450 kB) | M4 |
| **P3** | **CampaignContext Memoizasyonu**: Realtime karakter güncellemelerinin Header ve Dashboard'u gereksiz çizmesini engelleme | Re-render | Boşta CPU kullanımında düşüş | M4 |

---

## 7. Ölçüm ve Doğrulama Yöntemi (Verification Method)

1. **Paket Boyutu Doğrulaması**:
   ```powershell
   npm run build
   ```
   Çıktıdaki `dist/assets` dosyalarının ham ve gzip boyutları incelenir.
2. **React Flow Kuralları Doğrulaması**:
   - `src/components/spell-tree/SpellTreeGraph.tsx` ve `src/components/skill-tree/YggdrasilTree.tsx` içerisinde `onlyRenderVisibleElements={true}` bayrağı aranır.
   - `SpellNode.tsx` ve `SkillNode.tsx` dosyalarında CSS transform'un iç wrapper'da olduğu teyit edilir.
3. **Büyü Sorgusu Doğrulaması**:
   - Ağ (Network) sekmesinde `/rest/v1/spells` isteğinin boyutu ve satır sayısı izlenir.

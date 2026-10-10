# Supabase Veritabanı Migrasyon Kılavuzu (Database Migration Guide)

Bu dizin, D&D Sefer Yönetim Uygulaması için hazırlanan R6 gereksinimi kapsamındaki idempotent (tekrar çalıştırılabilir) ve yıkıcı olmayan (non-destructive) veritabanı migrasyonlarını içerir.

## Migrasyon Dosyaları ve Çalıştırma Sırası

1. **`01_security_and_rls_hardening.sql`**:
   - **Amaç**: RLS sonsuz özyineleme (infinite recursion - 42P17) hatasını önleyen `public.is_admin()` ve `public.is_gm()` `SECURITY DEFINER` yardımcı fonksiyonlarını oluşturur/günceller.
   - `profiles` tablosuna `protect_profile_role` tetikleyicisi ekleyerek kullanıcıların kendi rollerini yetkisiz biçimde `admin` veya `gm` yapmalarını engeller.
   - `spell_trees`, `spell_tree_assignments` ve `spells` tablolarındaki satır içi `profiles` sorgularını `public.is_gm()` ile değiştirir.
   - `character_stats`, `inventory_items`, `map_state`, `map_tokens` ve `admin_logs` tablolarındaki gevşek `auth.uid() IS NOT NULL` politikalarını sıkarak yetkisiz manipülasyonu engeller.

2. **`02_schema_consistency.sql`**:
   - **Amaç**: Veritabanı şeması ile TypeScript arayüzleri arasındaki tutarlılığı sağlar.
   - `map_tokens` tablosuna eksik olan `label text` kolonunu ekler (harita render aşamasındaki `split` çökmesini engeller).
   - `inventory_items` tablosuna `slot_index int DEFAULT 0 CHECK (slot_index >= 0 AND slot_index < 24)` ekler (24-slot RPG envanter kalıcılığı).
   - `xp_ledger` tablosunu ve harcanan XP'leri silmeyen atomik `public.gm_award_xp()` RPC fonksiyonunu kurar.

3. **`03_new_gm_modules.sql`**:
   - **Amaç**: R5 gereksinimi olan 3 yeni GM modülünün kalıcı tablolarını ve RLS politikalarını oluşturur:
     - **Modül 1 (Savaş & İnisiyatif Takipçisi)**: `campaign_encounters` ve `encounter_combatants`
     - **Modül 2 (Canlı Atmosfer & Sefer Günlüğü)**: `campaign_environments` ve `session_chronicles`
     - **Modül 3 (Ganimet Sandığı & Envanter Dağıtıcı)**: `campaign_loot_chests`
   - Tablolarda Row Level Security (RLS) etkinleştirir: Oyuncular sadece okuyabilir (`SELECT`), GM'ler ise tam yetkiye (`INSERT/UPDATE/DELETE`) sahiptir.
   - Tabloları `supabase_realtime` yayınına ekler.

## Nasıl Uygulanır? (How to Apply)

### Yöntem 1: Supabase Dashboard SQL Editor (Önerilen)
1. Supabase Dashboard'unuza giriş yapın (`https://supabase.com/dashboard`).
2. Projenizi seçip sol menüden **SQL Editor** sekmesine gidin.
3. Sırasıyla şu dosyaların içeriğini yapıştırıp **Run** butonuna basın:
   - `01_security_and_rls_hardening.sql`
   - `02_schema_consistency.sql`
   - `03_new_gm_modules.sql`

### Güvenlik ve Geriye Dönüklük Güvencesi
- Tüm migrasyonlar `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION` ve `DROP POLICY IF EXISTS` yönergeleriyle yazılmıştır.
- Hiçbir `DROP TABLE`, `TRUNCATE` veya kolon silme komutu içermez. Mevcut 3.150 büyü ve karakter verisi kesinlikle korunur.

# JokerAI - Metrik Kaydı

Bu dosya geliştirme süresince tutulur. Her agent oturumunun sonunda satır eklenir ve `docs(metrics)` commit'i atılır.
Token / $ değerleri Cursor kullanım panelinden (Settings > Usage) oturum sonunda okunur.

## Geliştirme oturumları (coding agent)

| # | Tarih | Başlangıç | Bitiş | Süre (saat) | Coding agent | Model | Yapılan iş | Token | Maliyet ($) |
|---|-------|-----------|-------|-------------|--------------|-------|------------|-------|-------------|
| 1 | 2026-10-18 | 02:37 | 03:52 | 1.25 | Cursor Agent (Plan modu) | Auto | Konu analizi, mimari plan, deploy/güvenlik/commit kararları | _panelden_ | _panelden_ |
| 2 | 2026-10-18 | 03:52 | 05:30 | 1.65 | Cursor Agent | Auto | Ortam, deploy, veri modeli, oturum/yetki, 3 iş akışı, AI katmanı, testler, kurtarma doğrulaması, README | _panelden_ | _panelden_ |

## Çalışma zamanı maliyeti (ürün içi OpenAI)

Ürünün kendi LLM çağrıları `agent_runs` tablosuna yazılır ve uygulamadaki "AI Maliyeti" panelinde görülür.
Demo öncesi toplam buraya kopyalanır.

| Tarih | Çağrı sayısı | Giriş token | Çıkış token | Maliyet ($) | Model |
|-------|--------------|-------------|-------------|-------------|-------|
| | | | | | |

## Altyapı notları

| Kalem | Değer |
|-------|-------|
| Render Postgres oluşturma tarihi | 2026-10-18 |
| Render Postgres son kullanma tarihi | ~2026-11-17 (oluşturma + 30 gün); demo bundan sonraysa yeni DB + `demo:reset` |
| İlk canlı deploy | 2026-10-18 04:57 (Gün 1) |
| Canlı PingJob doğrulaması | 2026-10-18 05:00, 391 ms, Render içi Puma + Solid Queue |
| Canlı demo reset + kurtarma doğrulaması | 2026-10-18 05:23, 6 kullanıcı / 3 proje / 20 görev (bkz. DEPLOY.md) |
| Ürün içi OpenAI anahtarı | Render'da henüz tanımlı değil; tanımlanınca canlı AI akışı doğrulanacak |
| Frontend URL | https://jokerai.abdulsametok.com |
| API URL | https://api-jokerai.abdulsametok.com |

## Özet (teslim için)

| Metrik | Değer |
|--------|-------|
| Toplam token maliyeti ($) | Coding agent: Cursor panelinden doldurulacak. Ürün içi: canlı "AI maliyeti" ekranından |
| Toplam çalışma süresi (saat) | 2.9 |
| Satır sayısı (LOC) | 5.554 (boş satırsız; git'te izlenen .rb/.rake/.ts/.tsx/.css/.yml/.erb/.mjs, schema.rb ve bin/ hariç) |
| Kullanılan model(ler) | Geliştirme: Cursor Auto. Ürün içi: OpenAI gpt-4o-mini |
| Coding agent(lar) | Cursor Agent |
| Agent oturum sayısı | 2 |

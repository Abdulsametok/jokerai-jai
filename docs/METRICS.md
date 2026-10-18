# JokerAI - Metrik Kaydı

Bu dosya geliştirme süresince tutulur. Her agent oturumunun sonunda satır eklenir ve `docs(metrics)` commit'i atılır.
Token / $ değerleri Cursor kullanım panelinden (Settings > Usage) oturum sonunda okunur.

## Geliştirme oturumları (coding agent)

| # | Tarih | Başlangıç | Bitiş | Süre (saat) | Coding agent | Model | Yapılan iş | Token | Maliyet ($) |
|---|-------|-----------|-------|-------------|--------------|-------|------------|-------|-------------|
| 1 | 2026-10-18 | 02:37 | 03:52 | 1.25 | Cursor Agent (Plan modu) | Auto | Konu analizi, mimari plan, deploy/güvenlik/commit kararları | _panelden_ | _panelden_ |
| 2 | 2026-10-18 | 03:52 | _devam_ | | Cursor Agent | Auto | Gün 1: ortam kurulumu, Rails API + Next.js iskeleti, deploy | _panelden_ | _panelden_ |

## Çalışma zamanı maliyeti (ürün içi OpenAI)

Ürünün kendi LLM çağrıları `agent_runs` tablosuna yazılır ve uygulamadaki "AI Maliyeti" panelinde görülür.
Demo öncesi toplam buraya kopyalanır.

| Tarih | Çağrı sayısı | Giriş token | Çıkış token | Maliyet ($) | Model |
|-------|--------------|-------------|-------------|-------------|-------|
| | | | | | |

## Altyapı notları

| Kalem | Değer |
|-------|-------|
| Render Postgres oluşturma tarihi | _deploy sonrası doldurulacak_ |
| Render Postgres son kullanma tarihi | _oluşturma + 30 gün_ |
| Frontend URL | https://jokerai.abdulsametok.com |
| API URL | https://api-jokerai.abdulsametok.com |

## Özet (teslim için)

| Metrik | Değer |
|--------|-------|
| Toplam token maliyeti ($) | |
| Toplam çalışma süresi (saat) | |
| Satır sayısı (LOC) | |
| Kullanılan model(ler) | |
| Coding agent(lar) | Cursor Agent |
| Agent oturum sayısı | |

# Deploy rehberi

| Parça | Platform | Adres |
|-------|----------|-------|
| Frontend (Next.js) | Vercel | https://jokerai.abdulsametok.com |
| API (Rails 8) | Render (free) | https://api-jokerai.abdulsametok.com |
| Veritabanı | Render Postgres (free) | sadece Render içi + harici URL |

## 1. Render (API + Postgres)

1. Render > **New > Blueprint** > GitHub `Abdulsametok/jokerai-jai` reposunu seç. Kökteki [render.yaml](../render.yaml) okunur: `jokerai-api` web servisi ve `jokerai-db` Postgres oluşur.
2. İstendiğinde `OPENAI_API_KEY` değerini gir (sadece Render'da durur, tarayıcıya gitmez).
3. İlk deploy bitince `https://jokerai-api.onrender.com/api/health` açılmalı ve `jobs.alive_processes` içinde `Supervisor`, `Worker`, `Dispatcher` görünmeli.
4. Servis > Settings > Custom Domains: `api-jokerai.abdulsametok.com` (blueprint ekler) doğrulanana kadar bekle.
5. `ADMIN_TOKEN` değerini servis > Environment sekmesinden kopyala (iş doğrulaması ve demo reset için).

## 2. Vercel (frontend)

1. Vercel > **Add New > Project** > aynı repo. **Root Directory: `web`**.
2. Environment Variables: `NEXT_PUBLIC_API_URL = https://api-jokerai.abdulsametok.com`
3. Deploy > Settings > Domains: `jokerai.abdulsametok.com` ekle.

## 3. Cloudflare DNS

Her iki kayıt **DNS only (gri bulut)** olmalı; proxy açıkken Vercel/Render sertifika üretemez ve 525 hatası görülür.

| Tip | Ad | Hedef | Proxy |
|-----|----|-------|-------|
| CNAME | `jokerai` | `cname.vercel-dns.com` | DNS only |
| CNAME | `api-jokerai` | `jokerai-api.onrender.com` | DNS only |

Oturum çerezi API alan adına (host-only, `HttpOnly; Secure; SameSite=Lax`) yazılır. İki alt alan adı aynı site (`abdulsametok.com`) sayıldığı için tarayıcı çerezi gönderir. Bu yüzden giriş sadece özel alan adlarıyla çalışır, `*.vercel.app` önizleme adreslerinde çalışmaz.

## 4. Canlı doğrulama

```powershell
$api = "https://api-jokerai.abdulsametok.com"
$token = "<ADMIN_TOKEN>"
Invoke-RestMethod "$api/api/health" | ConvertTo-Json -Depth 5
$c = Invoke-RestMethod -Method Post "$api/api/health/job_check" -Headers @{ "X-Admin-Token" = $token }
Start-Sleep 5
Invoke-RestMethod "$api/api/health/job_check/$($c.id)" -Headers @{ "X-Admin-Token" = $token }   # status: done
```

Uykudan uyanma testi: servis 15 dk boşta kalınca uyur. Uyandıktan sonra aynı iş kontrolünü tekrar çalıştır; `status: done` dönmeli.

## 5. Demo verisini yeniden kurma

İki yol (Render free'de Shell yok):

```powershell
# a) Yerelden, Render > jokerai-db > Connect > External Database URL ile
cd api
$env:DATABASE_URL = "<EXTERNAL_DATABASE_URL>"
$env:RAILS_ENV = "production"; $env:SECRET_KEY_BASE = "local-reset"
ruby bin/rails db:prepare demo:reset
Remove-Item Env:DATABASE_URL, Env:RAILS_ENV, Env:SECRET_KEY_BASE

# b) Korumalı uç nokta
Invoke-RestMethod -Method Post "$api/api/admin/demo_reset" -Headers @{ "X-Admin-Token" = $token }
```

Yedek (repo dışına):

```powershell
docker run --rm -v "${HOME}\jokerai-backups:/backup" postgres:17-alpine pg_dump "<EXTERNAL_DATABASE_URL>" -Fc -f /backup/jokerai-$(Get-Date -Format yyyyMMdd-HHmm).dump
```

Geri yükleme (yeni bir Render DB'ye ya da yerel konteynere):

```powershell
docker run --rm -v "${HOME}\jokerai-backups:/backup" postgres:17-alpine pg_restore --no-owner --clean --if-exists -d "<HEDEF_DATABASE_URL>" /backup/<dosya>.dump
```

Render ücretsiz DB 30 gün sonra silinir (bu kurulumda ~2026-11-17). DB silinirse: yeni DB oluştur, servisin `DATABASE_URL`'ini güncelle, deploy et. Build komutundaki `db:prepare` şemayı kurar, ardından (b) yolu ile seed'i yükle.

### Kurtarma doğrulaması (2026-10-18)

| Adım | Ortam | Sonuç |
|------|-------|-------|
| Boş DB'de `db:prepare` (create + şema + seed) | yerel Postgres 17 | 6 kullanıcı, 3 proje, 20 görev |
| `db:seed` ikinci kez | yerel | sayılar değişmedi (idempotent) |
| `pg_dump -Fc` sonra yeni DB'ye `pg_restore` | yerel | aynı sayılar |
| `demo:reset` | yerel | aynı sayılar |
| `POST /api/admin/demo_reset` | canlı Render | `{"users":6,"projects":3,"tasks":20}`, ardından demo girişi 201 |

## 6. Uyku önleme

cron-job.org (ücretsiz) üzerinde `https://api-jokerai.abdulsametok.com/api/health` adresine 10 dakikada bir GET. Sunumdan 10 dk önce siteyi elle aç.

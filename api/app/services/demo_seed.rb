# Fully synthetic demo data for the fictional "Northwind Lojistik" company.
# run! is idempotent (find_or_create_by!), reset! wipes app tables first.
class DemoSeed
  PASSWORD = "jokerai2026".freeze
  APP_TABLES = %w[
    notifications activities comments artifacts agent_runs goals tasks sections
    project_memberships projects sessions users teams job_checks
  ].freeze

  TEAMS = [ "Operasyon", "Planlama", "Müşteri Deneyimi", "BT Entegrasyon" ].freeze

  USERS = [
    { key: :deniz, name: "Deniz Arslan", email: "deniz@northwind.test", title: "Operasyon Müdürü", team: "Operasyon", skills: %w[yönetim bütçe onay] },
    { key: :ece, name: "Ece Yıldız", email: "ece@northwind.test", title: "Vardiya Planlama Uzmanı", team: "Planlama", skills: %w[vardiya kapasite planlama] },
    { key: :mert, name: "Mert Kaya", email: "mert@northwind.test", title: "Veri Analisti", team: "Planlama", skills: %w[analiz tahmin raporlama] },
    { key: :selin, name: "Selin Demir", email: "selin@northwind.test", title: "Kurumsal İletişim Uzmanı", team: "Müşteri Deneyimi", skills: %w[içerik duyuru eğitim] },
    { key: :burak, name: "Burak Şahin", email: "burak@northwind.test", title: "Entegrasyon Mühendisi", team: "BT Entegrasyon", skills: %w[api entegrasyon veri] },
    { key: :zeynep, name: "Zeynep Aydın", email: "zeynep@northwind.test", title: "Müşteri Deneyimi Lideri", team: "Müşteri Deneyimi", skills: %w[sla müşteri süreç] }
  ].freeze

  def self.run!
    new.run!
  end

  def self.reset!
    ActiveRecord::Base.connection.truncate_tables(*APP_TABLES)
    run!
  end

  def run!
    ActiveRecord::Base.transaction do
      create_users
      seed_peak_season
      seed_last_mile
      seed_wms_integration
    end
    { users: User.count, projects: Project.count, tasks: Task.count }
  end

  private

  def today
    @today ||= Date.current
  end

  def u(key)
    @users.fetch(key)
  end

  def create_users
    teams = TEAMS.index_with { |name| Team.find_or_create_by!(name: name) }
    @users = USERS.to_h do |attrs|
      user = User.find_or_create_by!(email: attrs[:email]) do |record|
        record.name = attrs[:name]
        record.title = attrs[:title]
        record.team = teams[attrs[:team]]
        record.skills = attrs[:skills]
        record.password = PASSWORD
      end
      [ attrs[:key], user ]
    end
  end

  def project(name, owner:, description:, color:, due_in:, members:)
    project = Project.find_or_create_by!(name: name, owner: owner) do |p|
      p.description = description
      p.color = color
      p.due_on = today + due_in
    end
    members.each { |key, role| project.ensure_member!(u(key), role: role) }
    project
  end

  def task(project, section_kind, title, assignee: nil, due_in: nil, priority: "medium", description: nil, parent: nil, completed: false, agent_kind: nil)
    section = project.section_of_kind(section_kind)
    project.tasks.find_or_create_by!(title: title, parent: parent) do |t|
      t.section = parent ? parent.section : section
      t.assignee = assignee && u(assignee)
      t.creator = project.owner
      t.due_on = due_in && today + due_in
      t.priority = priority
      t.description = description
      t.completed_at = completed ? Time.current - rand(1..48).hours : nil
      t.agent_executable = agent_kind.present?
      t.agent_kind = agent_kind
    end
  end

  def comment(task, author, body)
    task.comments.find_or_create_by!(author: u(author), body: body)
  end

  def log(project, task, actor, action, data = {})
    Activity.find_or_create_by!(project: project, task: task, actor: u(actor), action: action) do |a|
      a.data = data
      a.created_at = Time.current - rand(1..72).hours
    end
  end

  def seed_peak_season
    p = project("Q4 Yoğun Sezon Hazırlığı - İstanbul Aktarma Merkezi",
      owner: u(:deniz), color: "#65a30d", due_in: 21,
      description: "Kasım-Aralık yoğun sezonu için kapasite, vardiya, geçici personel ve müşteri iletişimi hazırlığı.",
      members: { ece: "member", mert: "member", selin: "member", burak: "admin", zeynep: "member" })

    t1 = task(p, "done", "Geçen yılın yoğun sezon hacim verisini çıkar", assignee: :mert, due_in: -5, priority: "high", completed: true,
      description: "Kasım-Aralık günlük paket hacmi, saatlik pikler ve hat bazlı dağılım.")
    t2 = task(p, "doing", "Günlük hacim tahmini (+%18 büyüme senaryosu)", assignee: :mert, due_in: 0, priority: "urgent",
      description: "Geçen yıl verisi + bu yılın büyüme oranı ile gün/saat bazlı tahmin.")
    t3 = task(p, "todo", "Vardiya planı taslağı (3 vardiya, 7/24)", assignee: :ece, due_in: 2, priority: "high",
      description: "Tahmine göre vardiya başına gereken ayrıştırma personeli ve hat sorumlusu.")
    t4 = task(p, "todo", "Geçici personel ihtiyacını ajansa ilet", assignee: :deniz, due_in: -1, priority: "high")
    t5 = task(p, "review", "Müşterilere yoğun sezon teslim süresi duyurusu", assignee: :selin, due_in: 4, priority: "medium",
      description: "Kurumsal müşterilere gönderilecek e-posta: kesim saatleri ve olası gecikmeler.")
    t6 = task(p, "todo", "El terminali ve tarayıcı envanter kontrolü", assignee: :burak, due_in: 6, priority: "medium")
    task(p, "todo", "Yoğun sezon risk ve aksiyon listesi", assignee: :deniz, due_in: 8, priority: "low")

    t2.update!(depends_on: t1) unless t2.depends_on_id
    t3.update!(depends_on: t2) unless t3.depends_on_id

    task(p, "todo", "Saatlik pik tablosu", assignee: :mert, parent: t2, completed: true)
    task(p, "todo", "Hat bazlı dağılım", assignee: :mert, parent: t2)
    task(p, "todo", "Gece vardiyası ekip lideri ataması", assignee: :ece, parent: t3)
    task(p, "todo", "Mola ve devir-teslim saatleri", assignee: :ece, parent: t3)

    comment(t2, :deniz, "@Mert Kaya tahmini perşembeye kadar paylaşabilir misin? Vardiya planı buna bağlı.")
    comment(t2, :mert, "Saatlik pik tablosu hazır, hat bazlı dağılımı bugün bitiriyorum.")
    comment(t5, :zeynep, "Kesim saatini 17:00 olarak yazalım, geçen yıl 18:00 çok sıkışık oldu.")

    log(p, t1, :mert, "task_completed", { title: t1.title })
    log(p, t2, :deniz, "task_assigned", { assignee: "Mert Kaya" })
    log(p, t5, :selin, "task_moved", { from: "Devam ediyor", to: "İncelemede" })

    Notification.find_or_create_by!(user: u(:deniz), actor: u(:mert), task: t2, kind: "commented") do |n|
      n.project = p
      n.message = "Mert Kaya yorum yaptı: #{t2.title}"
    end
    Notification.find_or_create_by!(user: u(:deniz), actor: u(:zeynep), task: t5, kind: "mentioned") do |n|
      n.project = p
      n.message = "Zeynep Aydın sizi bir göreve ekledi: #{t5.title}"
    end
    [ t3, t4, t6 ]
  end

  def seed_last_mile
    p = project("Son Mil Teslimat SLA İyileştirme",
      owner: u(:zeynep), color: "#0d9488", due_in: 35,
      description: "Ankara bölgesinde son mil teslimat başarı oranını %92'den %96'ya çıkarmak.",
      members: { deniz: "admin", mert: "member", selin: "member" })

    task(p, "done", "Başarısız teslimat nedenlerini sınıflandır", assignee: :mert, due_in: -7, completed: true, priority: "high")
    task(p, "doing", "Adreste bulunamama için SMS ön bilgilendirme pilotu", assignee: :zeynep, due_in: 3, priority: "high")
    task(p, "todo", "Kurye rota yoğunluk analizi", assignee: :mert, due_in: 5)
    task(p, "todo", "Teslimat noktası (pickup) anlaşmaları listesi", assignee: :deniz, due_in: 1, priority: "medium")
    task(p, "review", "Müşteri memnuniyet anketi soruları", assignee: :selin, due_in: 2)
  end

  def seed_wms_integration
    p = project("Depo Yönetim Sistemi API Entegrasyonu",
      owner: u(:burak), color: "#2563eb", due_in: 28,
      description: "Yeni depo yönetim sisteminin sipariş ve stok uç noktalarının mevcut taşıma sistemine bağlanması.",
      members: { deniz: "admin", mert: "member" })

    task(p, "done", "Uç nokta envanteri ve yetkilendirme yöntemi", assignee: :burak, due_in: -3, completed: true)
    task(p, "doing", "Sipariş durumu webhook alıcısı", assignee: :burak, due_in: 4, priority: "high")
    task(p, "todo", "Stok senkronizasyonu hata senaryoları", assignee: :burak, due_in: 9)
    task(p, "todo", "Entegrasyon için operasyon onayı", assignee: :deniz, due_in: 0, priority: "urgent")
  end
end

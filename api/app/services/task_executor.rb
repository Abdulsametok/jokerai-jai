# Executes an agent-executable task: produces the actual deliverable
# (analysis, draft, content, integration spec, checklist) and hands it to a
# human for approval instead of handing the human a to-do.
class TaskExecutor
  SCHEMA = {
    type: "object",
    additionalProperties: false,
    required: %w[title content_markdown summary_comment],
    properties: {
      title: { type: "string" },
      content_markdown: { type: "string" },
      summary_comment: { type: "string" }
    }
  }.freeze

  KIND_GUIDE = {
    "analysis" => "Sayısal bir analiz üret: varsayımları açıkça yaz, en az bir markdown tablo ve sonuç/öneri bölümü olsun.",
    "draft" => "Uygulanabilir bir plan/prosedür taslağı üret: adımlar, sorumlular, süreler ve tablo halinde takvim.",
    "content" => "Gönderilmeye hazır bir metin üret (e-posta/duyuru/eğitim notu): konu satırı, gövde ve kapanış.",
    "integration" => "Teknik entegrasyon spesifikasyonu üret: uç noktalar, örnek JSON istek/yanıt, hata senaryoları ve test adımları.",
    "checklist" => "Kontrol listesi üret: gruplanmış maddeler (- [ ] biçiminde), sorumlu ve kontrol zamanı."
  }.freeze

  SYSTEM = <<~PROMPT.freeze
    Sen JokerAI'sın: görevleri insan yerine yürüten ve sonucu onaya sunan yürütme ajanısın.
    Sana bir görev ve bağlamı verilecek. Görevi "yapılacaklar listesi" olarak değil, BİTMİŞ İŞ olarak teslim et.
    - Çıktı Türkçe, net ve doğrudan kullanılabilir olsun; markdown kullan (başlık, tablo, liste).
    - Şirket hayali "Northwind Lojistik"tir; tüm rakamlar sentetik/varsayımdır, bunu kısa bir notla belirt.
    - Önceki adımların onaylı çıktıları verildiyse onlarla tutarlı ol.
    - Revizyon isteniyorsa geri bildirimi birebir uygula ve önceki sürümü iyileştir.
    - Uzunluk: 250-600 kelime.
    - summary_comment: onaylayacak yöneticiye 1-2 cümlelik özet ve kontrol etmesi gereken nokta.
  PROMPT

  def initialize(task, revision_of: nil)
    @task = task
    @revision_of = revision_of
  end

  def call
    data = Llm.call(
      kind: @revision_of ? "revise" : "execute", system: SYSTEM, user: input.to_json, schema: SCHEMA,
      schema_name: "task_output", user_record: @task.assignee, goal: @task.project.goal, task: @task
    )
    [ data, AgentRun.where(task: @task).order(:id).last ]
  end

  private

  def input
    {
      project: { name: @task.project.name, description: @task.project.description, goal: @task.project.goal&.title },
      task: {
        title: @task.title, description: @task.description, kind: @task.agent_kind,
        guide: KIND_GUIDE[@task.agent_kind], due_on: @task.due_on, owner: @task.assignee&.name,
        subtasks: @task.subtasks.map(&:title)
      },
      previous_steps: previous_steps,
      revision: @revision_of && { previous_version: @revision_of.content, feedback: @revision_of.feedback },
      today: Date.current
    }
  end

  def previous_steps
    chain = []
    dependency = @task.depends_on
    while dependency && chain.size < 3
      approved = dependency.artifacts.where(status: "approved").order(:version).last
      chain << { title: dependency.title, output: approved&.content&.first(3000) }
      dependency = dependency.depends_on
    end
    chain
  end
end

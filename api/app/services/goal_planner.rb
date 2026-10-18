# Turns a one-sentence goal into an executable project plan: tasks, owners
# (by skills and current workload), deadlines, dependencies and which tasks
# the agent can execute itself.
class GoalPlanner
  SCHEMA = {
    type: "object",
    additionalProperties: false,
    required: %w[project_name summary tasks risks],
    properties: {
      project_name: { type: "string" },
      summary: { type: "string" },
      risks: { type: "array", items: { type: "string" } },
      tasks: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: %w[ref title description assignee_id due_in_days priority depends_on agent_executable agent_kind subtasks],
          properties: {
            ref: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            assignee_id: { type: [ "integer", "null" ] },
            due_in_days: { type: "integer" },
            priority: { type: "string", enum: Task::PRIORITIES },
            depends_on: { type: [ "string", "null" ] },
            agent_executable: { type: "boolean" },
            agent_kind: { type: [ "string", "null" ], enum: Task::AGENT_KINDS + [ nil ] },
            subtasks: { type: "array", items: { type: "string" } }
          }
        }
      }
    }
  }.freeze

  SYSTEM = <<~PROMPT.freeze
    Sen JokerAI'sın: bir lojistik şirketinde hedefleri uçtan uca yürütülebilir projelere çeviren yürütme ajanısın.
    Görevin, verilen hedef için gerçekçi ve uygulanabilir bir proje planı çıkarmak. Kurallar:
    - 5 ile 8 arası ana görev üret. Başlıklar kısa ve eylem odaklı olsun (Türkçe).
    - Her görevi ekipten EN UYGUN kişiye ata: unvan ve yeteneklere bak, açık görevi az olanı tercih et. Sadece verilen id'leri kullan.
    - Ajanın kendi başına üretebileceği işleri agent_executable=true yap ve türünü seç:
      analysis (veri/tahmin analizi), draft (plan/prosedür taslağı), content (duyuru, e-posta, eğitim metni),
      integration (teknik entegrasyon spesifikasyonu), checklist (kontrol listesi). Görevlerin en az yarısı ajan tarafından yürütülebilir olmalı.
    - Fiziksel saha işi, pazarlık, satın alma, nihai karar ve imza gibi işler insan işidir: agent_executable=false, agent_kind=null.
    - depends_on ile mantıklı bir sıra kur (ilk görevlerin bağımlılığı null). Döngü kurma.
    - due_in_days bugünden itibaren gün sayısıdır ve son tarihi aşmamalıdır.
    - Gerekirse görev başına en fazla 3 kısa alt görev ver.
    - risks alanına 2-4 somut risk yaz.
  PROMPT

  def initialize(goal)
    @goal = goal
  end

  def call
    data = Llm.call(
      kind: "plan", system: SYSTEM, user: input.to_json, schema: SCHEMA, schema_name: "goal_plan",
      user_record: @goal.user, goal: @goal
    )
    sanitize(data)
  end

  private

  def team
    @team ||= User.includes(:team).order(:id).map do |u|
      {
        id: u.id, name: u.name, title: u.title, team: u.team&.name, skills: u.skills,
        open_tasks: u.assigned_tasks.open.count
      }
    end
  end

  def input
    {
      goal: { title: @goal.title, context: @goal.context, deadline: @goal.deadline },
      today: Date.current,
      requested_by: { id: @goal.user.id, name: @goal.user.name, title: @goal.user.title },
      team: team
    }
  end

  def sanitize(data)
    ids = team.map { |m| m[:id] }
    refs = []
    data["tasks"] = Array(data["tasks"]).first(10).each_with_index.map do |task, index|
      task["ref"] = task["ref"].presence || "t#{index + 1}"
      task["ref"] = "t#{index + 1}" if refs.include?(task["ref"])
      refs << task["ref"]
      task["assignee_id"] = nil unless ids.include?(task["assignee_id"])
      task["assignee_name"] = team.find { |m| m[:id] == task["assignee_id"] }&.dig(:name)
      task["due_in_days"] = task["due_in_days"].to_i.clamp(0, 365)
      task["priority"] = "medium" unless Task::PRIORITIES.include?(task["priority"])
      task["agent_kind"] = nil unless task["agent_executable"] && Task::AGENT_KINDS.include?(task["agent_kind"])
      task["agent_executable"] = task["agent_kind"].present?
      task["subtasks"] = Array(task["subtasks"]).first(3)
      task
    end
    data["tasks"].each do |task|
      task["depends_on"] = nil unless refs.index(task["depends_on"])&.< refs.index(task["ref"])
    end
    data
  end
end

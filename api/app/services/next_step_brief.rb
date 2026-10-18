# When a step finishes, the person who owns the next (human) step gets a
# ready-to-use starting brief instead of a blank task.
class NextStepBrief
  SCHEMA = {
    type: "object",
    additionalProperties: false,
    required: %w[message],
    properties: { message: { type: "string" } }
  }.freeze

  SYSTEM = <<~PROMPT.freeze
    Sen JokerAI'sın. Bir görev az önce tamamlandı ve ona bağlı bir sonraki görev artık başlayabilir.
    Sonraki görevin sahibine doğrudan kullanabileceği kısa bir başlangıç notu yaz (Türkçe, en fazla 150 kelime):
    1) Önceki adımdan çıkan, bu görev için önemli 2-3 bilgi,
    2) Hemen atılacak ilk 3 somut adım (numaralı),
    3) Varsa dikkat edilmesi gereken risk.
    Selamlama ve gereksiz giriş cümlesi yazma.
  PROMPT

  def initialize(completed_task, next_task)
    @completed = completed_task
    @next = next_task
  end

  def call
    approved = @completed.artifacts.where(status: "approved").order(:version).last
    input = {
      completed_task: { title: @completed.title, description: @completed.description, output: approved&.content&.first(3000) },
      next_task: { title: @next.title, description: @next.description, owner: @next.assignee&.name, due_on: @next.due_on },
      project: @next.project.name
    }
    Llm.call(
      kind: "next_step", system: SYSTEM, user: input.to_json, schema: SCHEMA, schema_name: "next_step_brief",
      user_record: @next.assignee, goal: @next.project.goal, task: @next
    )["message"]
  end
end

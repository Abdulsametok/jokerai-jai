module Llm
  # Deterministic stand-in used in development/test when no OPENAI_API_KEY is
  # set. Never used in production (Llm.client raises there instead).
  class OfflineClient
    def model
      "demo-offline"
    end

    def complete(system:, user:, schema:, schema_name:)
      input = JSON.parse(user)
      data = send("offline_#{schema_name}", input)
      Result.new(data: data, model: model, tokens_in: (system.size + user.size) / 4, tokens_out: data.to_json.size / 4)
    end

    private

    def offline_goal_plan(input)
      people = input["team"]
      pick = ->(i) { people[i % people.size]["id"] }
      goal = input.dig("goal", "title")
      {
        "project_name" => goal.to_s.first(80),
        "summary" => "#{goal} için analiz, plan, iletişim ve uygulama adımları.",
        "tasks" => [
          plan_task("t1", "Mevcut durum analizi", "Hedefle ilgili mevcut veriyi özetle.", pick.(1), 2, "high", nil, true, "analysis"),
          plan_task("t2", "Uygulama planı taslağı", "Analize göre adım adım plan.", pick.(2), 4, "high", "t1", true, "draft"),
          plan_task("t3", "Paydaş duyurusu", "Ekibe ve müşterilere duyuru metni.", pick.(3), 5, "medium", "t2", true, "content"),
          plan_task("t4", "Saha hazırlığı ve ekip ataması", "Fiziksel hazırlık ve kişi atamaları.", pick.(0), 6, "medium", "t2", false, nil),
          plan_task("t5", "Kontrol listesi", "Canlıya geçiş öncesi kontrol listesi.", pick.(4), 7, "low", "t4", true, "checklist")
        ],
        "risks" => [ "Veri eksikliği", "Kapasite yetersizliği" ]
      }
    end

    def plan_task(ref, title, description, assignee_id, due, priority, depends_on, agent, kind)
      {
        "ref" => ref, "title" => title, "description" => description, "assignee_id" => assignee_id,
        "due_in_days" => due, "priority" => priority, "depends_on" => depends_on,
        "agent_executable" => agent, "agent_kind" => kind, "subtasks" => []
      }
    end

    def offline_task_output(input)
      task = input["task"]
      feedback = input.dig("revision", "feedback")
      content = +"## #{task['title']}\n\n"
      content << "> Revizyon notu: #{feedback}\n\n" if feedback
      content << "**Amaç:** #{task['description'].presence || task['title']}\n\n"
      content << "| Adım | Sorumlu | Süre |\n|---|---|---|\n| Veri toplama | Analist | 1 gün |\n| Taslak | JokerAI | 1 saat |\n| Onay | Yönetici | 15 dk |\n\n"
      content << "- Varsayım: rakamlar sentetik demo verisidir.\n"
      {
        "title" => "#{task['title']} - taslak",
        "content_markdown" => content,
        "summary_comment" => "Taslak hazır, onayınıza sunuldu."
      }
    end

    def offline_next_step_brief(input)
      next_task = input["next_task"]
      {
        "message" => "Önceki adım (#{input.dig('completed_task', 'title')}) tamamlandı. " \
                     "#{next_task['title']} için başlangıç noktası:\n\n1. Önceki çıktıyı gözden geçir.\n2. İlk taslağı paylaş.\n3. Engel varsa yorumda belirt."
      }
    end
  end
end

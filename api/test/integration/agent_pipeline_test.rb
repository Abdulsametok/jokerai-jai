require "test_helper"

class AgentPipelineTest < ActionDispatch::IntegrationTest
  setup do
    seed_demo
    Llm.client = Llm::OfflineClient.new
  end

  teardown { Llm.client = nil }

  def plan_and_accept_goal
    perform_enqueued_jobs do
      post "/api/goals", params: { goal: { title: "Bayram öncesi İzmir aktarma merkezinde kapasite artışı", deadline: 14.days.from_now.to_date } },
        as: :json, headers: json_headers
    end
    assert_response :accepted
    goal = Goal.find(body["goal"]["id"])
    assert_equal "planned", goal.reload.status
    assert goal.plan["tasks"].size >= 5

    perform_enqueued_jobs do
      post "/api/goals/#{goal.id}/accept", as: :json, headers: json_headers
    end
    assert_response :success
    Project.find(body["project_id"])
  end

  test "goal becomes a project and ready agent tasks are executed and sent for approval" do
    sign_in :deniz
    project = plan_and_accept_goal

    assert_equal 5, project.tasks.top_level.count
    first = project.tasks.find_by!(title: "Mevcut durum analizi")
    assert_equal "awaiting_review", first.agent_state
    assert_equal "review", first.section.kind
    assert_equal 1, first.artifacts.count
    assert_equal "pending_review", first.artifacts.first.status
    assert first.comments.where(by_agent: true).exists?

    blocked = project.tasks.find_by!(title: "Uygulama planı taslağı")
    assert_equal "idle", blocked.agent_state, "dependent agent task must wait for its dependency"

    assert AgentRun.where(kind: "plan", status: "ok").exists?
    assert AgentRun.where(kind: "execute", task: first).exists?
    assert AgentRun.where(kind: "execute").all? { |r| r.tokens_in.positive? }
  end

  test "approving output completes the task and passes the next step to the agent" do
    sign_in :deniz
    project = plan_and_accept_goal
    first = project.tasks.find_by!(title: "Mevcut durum analizi")

    perform_enqueued_jobs do
      post "/api/artifacts/#{first.artifacts.first.id}/approve", headers: json_headers
    end
    assert_response :success
    assert first.reload.completed?
    assert_equal "approved", first.agent_state

    following = project.tasks.find_by!(title: "Uygulama planı taslağı")
    assert_equal "awaiting_review", following.reload.agent_state
    assert following.activities.where(action: "next_step_prepared").exists?
  end

  test "human next step receives a ready starting brief" do
    sign_in :deniz
    project = plan_and_accept_goal
    draft = project.tasks.find_by!(title: "Uygulama planı taslağı")
    human = project.tasks.find_by!(title: "Saha hazırlığı ve ekip ataması")
    draft.update!(agent_executable: false, agent_kind: nil)

    perform_enqueued_jobs do
      patch "/api/tasks/#{draft.id}", params: { task: { completed: true } }, as: :json, headers: json_headers
    end
    assert human.comments.where(by_agent: true).exists?
    assert Notification.where(task: human, kind: "next_step").exists? if human.assignee && human.assignee != user(:deniz)
  end

  test "llm outage still hands the next step to its assignee" do
    sign_in :deniz
    project = plan_and_accept_goal
    draft = project.tasks.find_by!(title: "Uygulama planı taslağı")
    human = project.tasks.find_by!(title: "Saha hazırlığı ve ekip ataması")
    draft.update!(agent_executable: false, agent_kind: nil)
    human.update!(assignee: user(:mert))

    failing = Object.new
    def failing.model = "gpt-4o-mini"
    def failing.complete(**) = raise(Llm::Error, "OpenAI erişilemedi")
    Llm.client = failing

    perform_enqueued_jobs do
      patch "/api/tasks/#{draft.id}", params: { task: { completed: true } }, as: :json, headers: json_headers
    end
    assert_response :success
    refute human.comments.where(by_agent: true).exists?
    assert Notification.where(task: human, user: user(:mert), kind: "next_step").exists?
    assert AgentRun.where(kind: "next_step", status: "error").exists?
  end

  test "rejecting with feedback produces a new version" do
    sign_in :deniz
    project = plan_and_accept_goal
    first = project.tasks.find_by!(title: "Mevcut durum analizi")

    perform_enqueued_jobs do
      post "/api/artifacts/#{first.artifacts.first.id}/reject", params: { feedback: "Saatlik pikleri de ekle" },
        as: :json, headers: json_headers
    end
    assert_response :success
    versions = first.reload.artifacts.order(:version)
    assert_equal [ "rejected", "pending_review" ], versions.map(&:status)
    assert_includes versions.last.content, "Saatlik pikleri de ekle"
    assert AgentRun.where(kind: "revise", task: first).exists?
  end

  test "plain members cannot approve agent output and goals are private" do
    sign_in :deniz
    project = plan_and_accept_goal
    goal_id = project.goal.id
    artifact = project.tasks.find_by!(title: "Mevcut durum analizi").artifacts.first
    project.ensure_member!(user(:ece))
    delete "/api/session", headers: json_headers

    sign_in :ece
    post "/api/artifacts/#{artifact.id}/approve", headers: json_headers
    assert_response :forbidden
    assert_equal "pending_review", artifact.reload.status

    get "/api/goals/#{goal_id}"
    assert_response :not_found
  end
end

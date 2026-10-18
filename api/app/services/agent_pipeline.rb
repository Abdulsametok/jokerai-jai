# State machine for agent work on a task:
#   idle -> queued -> working -> awaiting_review -> approved (task completed)
#                                     \-> rejected with feedback -> queued (new version)
# Completing any task hands the next step a "usable pass" (NextStepJob).
module AgentPipeline
  module_function

  def enqueue_execution(task, revision_of: nil)
    task.update!(agent_state: "queued")
    Activity.log!(project: task.project, task: task, action: "agent_queued")
    ExecuteTaskJob.perform_later(task.id, revision_of&.id)
  end

  def execute!(task, revision_of: nil)
    task.update!(agent_state: "working")
    data, run = TaskExecutor.new(task, revision_of: revision_of).call

    Task.transaction do
      task.artifacts.where(status: "pending_review").update_all(status: "superseded")
      version = (task.artifacts.maximum(:version) || 0) + 1
      task.artifacts.create!(
        version: version, kind: task.agent_kind || "draft", title: data["title"].presence || task.title,
        content: data["content_markdown"], agent_run: run, status: "pending_review"
      )
      review = task.project.section_of_kind("review")
      task.move_to!(review, 0) if review && task.parent_id.nil? && task.section_id != review.id
      task.update!(agent_state: "awaiting_review")
      task.comments.create!(by_agent: true, body: data["summary_comment"]) if data["summary_comment"].present?
      Activity.log!(project: task.project, task: task, action: "artifact_generated", data: { version: version })
      notify_reviewers(task)
    end
  rescue StandardError => e
    Rails.logger.error("[AgentPipeline] task #{task.id} failed: #{e.class} #{e.message}")
    task.update_columns(agent_state: "failed", updated_at: Time.current)
    Activity.log!(project: task.project, task: task, action: "agent_failed", data: { error: e.message.first(200) })
  end

  def approve!(artifact, user)
    task = artifact.task
    Task.transaction do
      artifact.update!(status: "approved", reviewed_by: user, reviewed_at: Time.current)
      task.update!(agent_state: "approved")
      Activity.log!(project: task.project, task: task, actor: user, action: "artifact_approved", data: { version: artifact.version })
      unless task.completed?
        task.complete!
        TaskEvents.completed(task, user)
      end
    end
  end

  def reject!(artifact, user, feedback)
    task = artifact.task
    artifact.update!(status: "rejected", feedback: feedback, reviewed_by: user, reviewed_at: Time.current)
    Activity.log!(project: task.project, task: task, actor: user, action: "artifact_rejected", data: { feedback: feedback.first(200) })
    enqueue_execution(task, revision_of: artifact)
  end

  def after_completion(task)
    NextStepJob.perform_later(task.id) if task.dependents.open.exists?
  end

  # The usable pass: agent-executable next steps start immediately; human
  # next steps get a ready starting brief and a notification.
  def prepare_next_steps!(task)
    task.dependents.open.where(parent_id: nil).find_each do |next_task|
      if next_task.agent_executable
        next unless %w[idle failed].include?(next_task.agent_state)

        Activity.log!(project: next_task.project, task: next_task, action: "next_step_prepared", data: { from: task.title })
        enqueue_execution(next_task)
      else
        prepare_human_step!(task, next_task)
      end
    end
  end

  # A failed brief must not block the handoff: the assignee is still told the
  # dependency is done.
  def prepare_human_step!(task, next_task)
    message =
      begin
        NextStepBrief.new(task, next_task).call
      rescue StandardError => e
        Rails.logger.error("[AgentPipeline] brief for task #{next_task.id} failed: #{e.class} #{e.message}")
        nil
      end

    if message.present?
      next_task.comments.create!(by_agent: true, body: message)
      Activity.log!(project: next_task.project, task: next_task, action: "next_step_prepared", data: { from: task.title })
    end
    Notification.notify!(user: next_task.assignee, kind: "next_step", task: next_task,
      message: message.present? ? "'#{task.title}' tamamlandı. JokerAI '#{next_task.title}' için başlangıç notunu hazırladı." :
                                  "'#{task.title}' tamamlandı; '#{next_task.title}' artık başlayabilir.")
  end

  def notify_reviewers(task)
    managers = task.project.project_memberships.where(role: ProjectMembership::MANAGER_ROLES).includes(:user).map(&:user)
    managers.each do |user|
      Notification.notify!(user: user, kind: "approval_requested", task: task,
        message: "JokerAI '#{task.title}' görevini tamamladı, onayınızı bekliyor.")
    end
  end
end

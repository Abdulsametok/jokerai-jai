class ExecuteTaskJob < ApplicationJob
  queue_as :default
  discard_on ActiveRecord::RecordNotFound

  def perform(task_id, revision_of_id = nil)
    task = Task.find(task_id)
    revision_of = revision_of_id && task.artifacts.find_by(id: revision_of_id)
    AgentPipeline.execute!(task, revision_of: revision_of)
  end
end

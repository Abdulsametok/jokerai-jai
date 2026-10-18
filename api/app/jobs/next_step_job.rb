class NextStepJob < ApplicationJob
  queue_as :default
  discard_on ActiveRecord::RecordNotFound

  def perform(task_id)
    AgentPipeline.prepare_next_steps!(Task.find(task_id))
  rescue Llm::Error => e
    Rails.logger.error("[NextStepJob] task #{task_id}: #{e.message}")
  end
end

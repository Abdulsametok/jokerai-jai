class PlanGoalJob < ApplicationJob
  queue_as :default
  discard_on ActiveRecord::RecordNotFound

  def perform(goal_id)
    goal = Goal.find(goal_id)
    plan = GoalPlanner.new(goal).call
    goal.update!(plan: plan, status: "planned", error: nil)
  rescue ActiveRecord::RecordNotFound
    raise
  rescue StandardError => e
    Rails.logger.error("[PlanGoalJob] goal #{goal_id}: #{e.class} #{e.message}")
    goal&.update!(status: "failed", error: e.message.first(300))
  end
end

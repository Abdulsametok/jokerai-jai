module Api
  class GoalsController < ApplicationController
    def index
      goals = current_user.goals.order(created_at: :desc).limit(20)
      render json: { goals: goals.map { |g| ApiJson.goal(g) } }
    end

    def show
      render json: { goal: ApiJson.goal(current_user.goals.find(params[:id])) }
    end

    def create
      goal = current_user.goals.create!(params.require(:goal).permit(:title, :context, :deadline))
      PlanGoalJob.perform_later(goal.id)
      render json: { goal: ApiJson.goal(goal) }, status: :accepted
    end

    def accept
      goal = current_user.goals.find(params[:id])
      raise Forbidden, "Bu hedefin planı henüz hazır değil" unless goal.status == "planned"

      project = GoalProjectBuilder.new(
        goal, current_user,
        excluded_refs: Array(params[:excluded_refs]),
        assignee_overrides: params.fetch(:assignee_overrides, {}).permit!.to_h
      ).call
      render json: { goal: ApiJson.goal(goal.reload), project_id: project.id }
    end

    def replan
      goal = current_user.goals.find(params[:id])
      raise Forbidden, "Kabul edilmiş hedef yeniden planlanamaz" if goal.status == "accepted"

      goal.update!(status: "planning", error: nil, context: params[:context].presence || goal.context)
      PlanGoalJob.perform_later(goal.id)
      render json: { goal: ApiJson.goal(goal) }, status: :accepted
    end
  end
end

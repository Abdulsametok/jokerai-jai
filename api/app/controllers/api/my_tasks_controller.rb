module Api
  class MyTasksController < ApplicationController
    def index
      today = Date.current
      tasks = Task.accessible_by(current_user)
        .where(assignee_id: current_user.id)
        .includes(:assignee, :subtasks, :artifacts, :project)
        .order(Arel.sql("tasks.due_on IS NULL, tasks.due_on ASC, tasks.id ASC"))
        .to_a

      open, done = tasks.partition { |t| !t.completed? }
      groups = { overdue: [], today: [], this_week: [], later: [], no_date: [] }
      open.each do |task|
        key =
          if task.due_on.nil? then :no_date
          elsif task.due_on < today then :overdue
          elsif task.due_on == today then :today
          elsif task.due_on <= today.end_of_week then :this_week
          else :later
          end
        groups[key] << task
      end

      render json: {
        groups: groups.transform_values { |list| list.map { |t| with_project(t) } },
        recently_completed: done.sort_by(&:completed_at).reverse.first(10).map { |t| with_project(t) },
        awaiting_my_review: awaiting_review.map { |t| with_project(t) }
      }
    end

    private

    def with_project(task)
      ApiJson.task(task).merge(project: { id: task.project.id, name: task.project.name, color: task.project.color })
    end

    # Agent outputs waiting for this user's approval (projects they manage).
    def awaiting_review
      managed = current_user.project_memberships.where(role: ProjectMembership::MANAGER_ROLES).select(:project_id)
      Task.where(project_id: managed, agent_state: "awaiting_review")
        .includes(:assignee, :subtasks, :artifacts, :project)
        .order(:updated_at)
    end
  end
end

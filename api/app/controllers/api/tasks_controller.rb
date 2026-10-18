module Api
  class TasksController < ApplicationController
    TRACKED_FIELDS = %w[title description due_on priority assignee_id depends_on_id].freeze

    def show
      task = find_task!(params[:id])
      render json: { task: ApiJson.task_detail(task, current_user) }
    end

    def create
      project = find_project!(params[:project_id])
      attrs = task_params
      task = project.tasks.new(attrs.except(:completed).merge(creator: current_user))
      task.section ||= task.parent&.section || project.section_of_kind("todo") || project.sections.first
      Task.transaction do
        task.save!
        project.ensure_member!(task.assignee) if task.assignee
        Activity.log!(project: project, task: task, actor: current_user, action: task.parent ? "subtask_created" : "task_created", data: { title: task.title })
        notify_assignment(task)
        project.touch
      end
      render json: { task: ApiJson.task_detail(task, current_user) }, status: :created
    end

    def update
      task = find_task!(params[:id])
      attrs = task_params
      completed = attrs.delete(:completed)

      Task.transaction do
        task.assign_attributes(attrs)
        changes = task.changes.slice(*TRACKED_FIELDS)
        task.save!
        task.project.ensure_member!(task.assignee) if changes.key?("assignee_id") && task.assignee
        log_changes(task, changes)
        notify_assignment(task) if changes.key?("assignee_id")
        apply_completion(task, completed) unless completed.nil?
        task.project.touch
      end
      render json: { task: ApiJson.task_detail(task.reload, current_user) }
    end

    def move
      task = find_task!(params[:id])
      section = task.project.sections.find(params.require(:section_id))
      was_completed = task.completed?
      from = task.section&.name
      task.move_to!(section, params[:position].to_i)
      if from != section.name
        Activity.log!(project: task.project, task: task, actor: current_user, action: "task_moved", data: { from: from, to: section.name })
      end
      TaskEvents.completed(task, current_user) if task.completed? && !was_completed
      task.project.touch
      render json: { project: ApiJson.project_detail(task.project, current_user) }
    end

    def destroy
      task = find_task!(params[:id])
      project = task.project
      Activity.log!(project: project, actor: current_user, action: "task_deleted", data: { title: task.title })
      task.destroy!
      head :no_content
    end

    private

    def task_params
      permitted = params.require(:task).permit(
        :title, :description, :due_on, :priority, :assignee_id, :section_id, :parent_id,
        :depends_on_id, :agent_executable, :agent_kind, :completed
      )
      permitted[:completed] = ActiveModel::Type::Boolean.new.cast(permitted[:completed]) if permitted.key?(:completed)
      permitted
    end

    def apply_completion(task, completed)
      if completed && !task.completed?
        task.complete!
        TaskEvents.completed(task, current_user)
      elsif !completed && task.completed?
        task.reopen!
        Activity.log!(project: task.project, task: task, actor: current_user, action: "task_reopened")
      end
    end

    def log_changes(task, changes)
      return if changes.empty?

      if changes.key?("assignee_id")
        Activity.log!(project: task.project, task: task, actor: current_user, action: "task_assigned",
          data: { assignee: task.assignee&.name })
      end
      rest = changes.except("assignee_id")
      return if rest.empty?

      Activity.log!(project: task.project, task: task, actor: current_user, action: "task_updated",
        data: { fields: rest.keys })
    end

    def notify_assignment(task)
      return unless task.assignee

      Notification.notify!(user: task.assignee, actor: current_user, kind: "assigned", task: task,
        message: "#{current_user.name} size bir görev atadı: #{task.title}")
    end
  end
end

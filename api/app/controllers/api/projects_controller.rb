module Api
  class ProjectsController < ApplicationController
    def index
      projects = current_user.projects.includes(:owner, :goal, :project_memberships).order(updated_at: :desc)
      render json: { projects: projects.map { |p| ApiJson.project_summary(p, current_user) } }
    end

    def show
      render json: { project: ApiJson.project_detail(find_project!(params[:id]), current_user) }
    end

    def create
      project = Project.new(project_params.merge(owner: current_user))
      project.color ||= Project::COLORS.sample
      project.save!
      Activity.log!(project: project, actor: current_user, action: "project_created", data: { name: project.name })
      render json: { project: ApiJson.project_detail(project, current_user) }, status: :created
    end

    def update
      project = find_project!(params[:id])
      require_manager!(project)
      project.update!(project_params)
      render json: { project: ApiJson.project_detail(project, current_user) }
    end

    def destroy
      project = find_project!(params[:id])
      raise Forbidden, "Projeyi sadece sahibi silebilir" unless project.role_for(current_user) == "owner"

      project.destroy!
      head :no_content
    end

    private

    def project_params
      params.require(:project).permit(:name, :description, :color, :due_on)
    end
  end
end

module Api
  class MembersController < ApplicationController
    def create
      project = find_project!(params[:project_id])
      require_manager!(project)
      user = User.find(params.require(:user_id))
      role = params[:role].presence_in(%w[admin member]) || "member"
      project.ensure_member!(user, role: role)
      Activity.log!(project: project, actor: current_user, action: "member_added", data: { user: user.name })
      render json: { project: ApiJson.project_detail(project, current_user) }, status: :created
    end

    def destroy
      project = find_project!(params[:project_id])
      require_manager!(project)
      membership = project.project_memberships.find_by!(user_id: params[:id])
      raise Forbidden, "Proje sahibi çıkarılamaz" if membership.role == "owner"

      membership.destroy!
      render json: { project: ApiJson.project_detail(project, current_user) }
    end
  end
end

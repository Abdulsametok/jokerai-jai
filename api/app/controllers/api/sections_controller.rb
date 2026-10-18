module Api
  class SectionsController < ApplicationController
    def create
      project = find_project!(params[:project_id])
      section = project.sections.create!(
        name: params.require(:name),
        kind: "custom",
        position: (project.sections.maximum(:position) || -1) + 1
      )
      render json: { section: ApiJson.section(section) }, status: :created
    end

    def update
      project = find_project!(params[:project_id])
      section = project.sections.find(params[:id])
      section.update!(params.permit(:name))
      render json: { section: ApiJson.section(section) }
    end
  end
end

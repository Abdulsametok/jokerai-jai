module Api
  class ArtifactsController < ApplicationController
    before_action :load_artifact

    def approve
      AgentPipeline.approve!(@artifact, current_user)
      render json: { task: ApiJson.task_detail(@artifact.task.reload, current_user) }
    end

    def reject
      feedback = params.require(:feedback).to_s.strip
      raise ActionController::ParameterMissing, :feedback if feedback.empty?

      AgentPipeline.reject!(@artifact, current_user, feedback)
      render json: { task: ApiJson.task_detail(@artifact.task.reload, current_user) }
    end

    private

    # Only managers of the artifact's project may review agent output.
    def load_artifact
      @artifact = Artifact.joins(:task).merge(Task.accessible_by(current_user)).find(params[:id])
      require_manager!(@artifact.task.project)
      raise Forbidden, "Bu çıktı artık onay beklemiyor" unless @artifact.status == "pending_review"
    end
  end
end

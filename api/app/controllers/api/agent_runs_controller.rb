module Api
  class AgentRunsController < ApplicationController
    def create
      task = find_task!(params[:task_id])
      raise Forbidden, "Bu görev ajan tarafından yürütülebilir olarak işaretli değil" unless task.agent_executable
      raise Forbidden, "Ajan bu görev üzerinde zaten çalışıyor" if %w[queued working].include?(task.agent_state)

      AgentPipeline.enqueue_execution(task)
      render json: { task: ApiJson.task_detail(task.reload, current_user) }, status: :accepted
    end
  end
end

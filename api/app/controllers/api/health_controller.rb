module Api
  class HealthController < ApplicationController
    allow_unauthenticated_access
    before_action :require_admin_token, only: %i[create_job_check show_job_check]

    def show
      render json: {
        status: "ok",
        app: "jokerai-api",
        time: Time.current,
        database: database_status,
        jobs: jobs_status
      }
    end

    def create_job_check
      check = JobCheck.create!(enqueued_at: Time.current)
      PingJob.perform_later(check.id)
      render json: check, status: :accepted
    end

    def show_job_check
      render json: JobCheck.find(params[:id])
    end

    private

    def database_status
      ActiveRecord::Base.connection.select_value("SELECT 1") == 1 ? "ok" : "error"
    rescue StandardError => e
      "error: #{e.class}"
    end

    def jobs_status
      adapter = Rails.application.config.active_job.queue_adapter.to_s
      return { adapter: adapter } unless adapter == "solid_queue"

      processes = SolidQueue::Process.where("last_heartbeat_at > ?", SolidQueue.process_alive_threshold.ago)
      {
        adapter: adapter,
        alive_processes: processes.group(:kind).count,
        last_heartbeat_at: processes.maximum(:last_heartbeat_at),
        pending_jobs: SolidQueue::ReadyExecution.count,
        failed_jobs: SolidQueue::FailedExecution.count
      }
    rescue StandardError => e
      { adapter: adapter, error: e.class.name }
    end

    def require_admin_token
      head :unauthorized unless admin_token_valid?
    end
  end
end

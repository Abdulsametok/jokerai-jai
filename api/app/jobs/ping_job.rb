# Proves that background jobs are actually executed in the deployed process.
class PingJob < ApplicationJob
  queue_as :default

  def perform(job_check_id)
    JobCheck.find(job_check_id).update!(
      performed_at: Time.current,
      performed_by: "#{Socket.gethostname}:#{Process.pid}"
    )
  end
end

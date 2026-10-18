class JobCheck < ApplicationRecord
  def performed?
    performed_at.present?
  end

  def latency_ms
    return unless performed?

    ((performed_at - enqueued_at) * 1000).round
  end

  def as_json(*)
    {
      id: id,
      status: performed? ? "done" : "pending",
      enqueued_at: enqueued_at,
      performed_at: performed_at,
      performed_by: performed_by,
      latency_ms: latency_ms
    }
  end
end

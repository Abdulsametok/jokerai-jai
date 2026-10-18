class Artifact < ApplicationRecord
  STATUSES = %w[pending_review approved rejected superseded].freeze

  belongs_to :task
  belongs_to :agent_run, optional: true
  belongs_to :reviewed_by, class_name: "User", optional: true

  validates :title, :content, :kind, presence: true
  validates :status, inclusion: { in: STATUSES }
end

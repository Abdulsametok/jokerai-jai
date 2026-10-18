class Notification < ApplicationRecord
  KINDS = %w[assigned mentioned commented completed approval_requested agent_done next_step].freeze

  belongs_to :user
  belongs_to :actor, class_name: "User", optional: true
  belongs_to :task, optional: true
  belongs_to :project, optional: true

  validates :kind, inclusion: { in: KINDS }
  validates :message, presence: true

  scope :unread, -> { where(read_at: nil) }

  def self.notify!(user:, kind:, message:, actor: nil, task: nil, project: nil)
    return if user.nil? || (actor && user.id == actor.id)

    create!(user: user, actor: actor, kind: kind, message: message, task: task, project: project || task&.project)
  end
end

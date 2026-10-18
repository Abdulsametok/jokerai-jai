class Goal < ApplicationRecord
  STATUSES = %w[planning planned accepted failed].freeze

  belongs_to :user
  belongs_to :project, optional: true
  has_many :agent_runs, dependent: :nullify

  validates :title, presence: true, length: { maximum: 300 }
  validates :status, inclusion: { in: STATUSES }
end

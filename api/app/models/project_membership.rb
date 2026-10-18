class ProjectMembership < ApplicationRecord
  ROLES = %w[owner admin member].freeze
  MANAGER_ROLES = %w[owner admin].freeze

  belongs_to :project
  belongs_to :user

  validates :role, inclusion: { in: ROLES }
  validates :user_id, uniqueness: { scope: :project_id }
end

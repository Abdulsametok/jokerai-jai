class Project < ApplicationRecord
  DEFAULT_SECTIONS = [
    [ "Yapılacak", "todo" ],
    [ "Devam ediyor", "doing" ],
    [ "İncelemede", "review" ],
    [ "Tamamlandı", "done" ]
  ].freeze
  COLORS = %w[#65a30d #0d9488 #2563eb #7c3aed #db2777 #ea580c].freeze

  belongs_to :owner, class_name: "User"
  has_many :project_memberships, dependent: :destroy
  has_many :members, through: :project_memberships, source: :user
  has_many :sections, -> { order(:position, :id) }, dependent: :destroy, inverse_of: :project
  has_many :tasks, dependent: :destroy
  has_many :activities, dependent: :destroy
  has_one :goal, dependent: :nullify

  validates :name, presence: true, length: { maximum: 120 }

  after_create :add_owner_and_default_sections

  def role_for(user)
    project_memberships.find_by(user_id: user.id)&.role
  end

  def manager?(user)
    ProjectMembership::MANAGER_ROLES.include?(role_for(user))
  end

  def ensure_member!(user, role: "member")
    project_memberships.find_or_create_by!(user: user) { |m| m.role = role }
  end

  def section_of_kind(kind)
    sections.find_by(kind: kind)
  end

  def progress
    scope = tasks.where(parent_id: nil)
    total = scope.count
    done = scope.where.not(completed_at: nil).count
    { total: total, done: done, percent: total.zero? ? 0 : (done * 100.0 / total).round }
  end

  private

  def add_owner_and_default_sections
    project_memberships.create!(user: owner, role: "owner")
    DEFAULT_SECTIONS.each_with_index do |(name, kind), index|
      sections.create!(name: name, kind: kind, position: index)
    end
  end
end

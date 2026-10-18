class User < ApplicationRecord
  AVATAR_COLORS = %w[#65a30d #0d9488 #2563eb #7c3aed #db2777 #ea580c #ca8a04 #475569].freeze

  has_secure_password

  belongs_to :team, optional: true
  has_many :sessions, dependent: :destroy
  has_many :project_memberships, dependent: :destroy
  has_many :projects, through: :project_memberships
  has_many :assigned_tasks, class_name: "Task", foreign_key: :assignee_id, dependent: :nullify, inverse_of: :assignee
  has_many :notifications, dependent: :destroy
  has_many :goals, dependent: :destroy

  normalizes :email, with: ->(email) { email.strip.downcase }

  validates :name, presence: true, length: { maximum: 80 }
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, allow_nil: true

  before_validation :assign_avatar_color, on: :create

  def initials
    name.split.map { |part| part[0] }.first(2).join.upcase
  end

  private

  def assign_avatar_color
    self.avatar_color = AVATAR_COLORS[email.to_s.sum % AVATAR_COLORS.size] if avatar_color.blank? || avatar_color == "#65a30d"
  end
end

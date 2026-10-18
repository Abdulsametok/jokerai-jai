class Task < ApplicationRecord
  PRIORITIES = %w[low medium high urgent].freeze
  AGENT_KINDS = %w[content analysis draft integration checklist].freeze
  AGENT_STATES = %w[idle queued working awaiting_review approved failed].freeze

  belongs_to :project
  belongs_to :section, optional: true
  belongs_to :parent, class_name: "Task", optional: true
  belongs_to :depends_on, class_name: "Task", optional: true
  belongs_to :assignee, class_name: "User", optional: true
  belongs_to :creator, class_name: "User", optional: true

  has_many :subtasks, -> { order(:position, :id) }, class_name: "Task", foreign_key: :parent_id, dependent: :destroy, inverse_of: :parent
  has_many :dependents, class_name: "Task", foreign_key: :depends_on_id, dependent: :nullify, inverse_of: :depends_on
  has_many :comments, -> { order(:created_at) }, dependent: :destroy
  has_many :artifacts, -> { order(:version) }, dependent: :destroy
  has_many :activities, dependent: :destroy

  validates :title, presence: true, length: { maximum: 200 }
  validates :priority, inclusion: { in: PRIORITIES }
  validates :agent_kind, inclusion: { in: AGENT_KINDS }, allow_nil: true
  validates :agent_state, inclusion: { in: AGENT_STATES }
  validate :relations_belong_to_same_project

  scope :top_level, -> { where(parent_id: nil) }
  scope :open, -> { where(completed_at: nil) }

  before_create :assign_position

  def self.accessible_by(user)
    joins(project: :project_memberships).where(project_memberships: { user_id: user.id })
  end

  def completed?
    completed_at.present?
  end

  def latest_artifact
    artifacts.max_by(&:version)
  end

  # Board and completion stay in sync: done column <=> completed.
  def complete!
    update!(completed_at: Time.current, section: parent_id ? section : (project.section_of_kind("done") || section))
  end

  def reopen!
    target = section&.done? ? project.section_of_kind("todo") : section
    update!(completed_at: nil, section: target)
  end

  def move_to!(target_section, index)
    raise ActiveRecord::RecordInvalid, self unless target_section.project_id == project_id

    transaction do
      siblings = target_section.tasks.where(parent_id: nil).where.not(id: id).to_a
      index = index.to_i.clamp(0, siblings.size)
      siblings.insert(index, self)
      siblings.each_with_index do |task, position|
        Task.where(id: task.id).update_all(position: position, section_id: target_section.id)
      end
      reload
      if target_section.done? && !completed?
        update!(completed_at: Time.current)
      elsif !target_section.done? && completed?
        update!(completed_at: nil)
      end
    end
  end

  private

  def assign_position
    return if position.to_i.positive?

    scope = parent_id ? Task.where(parent_id: parent_id) : Task.where(section_id: section_id, parent_id: nil)
    self.position = (scope.maximum(:position) || -1) + 1
  end

  def relations_belong_to_same_project
    errors.add(:section, "başka projeye ait") if section && section.project_id != project_id
    errors.add(:parent, "başka projeye ait") if parent && parent.project_id != project_id
    errors.add(:depends_on, "başka projeye ait") if depends_on && depends_on.project_id != project_id
    errors.add(:depends_on, "kendisi olamaz") if depends_on_id.present? && depends_on_id == id
  end
end

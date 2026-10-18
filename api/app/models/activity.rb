class Activity < ApplicationRecord
  belongs_to :project
  belongs_to :task, optional: true
  belongs_to :actor, class_name: "User", optional: true

  validates :action, presence: true

  # actor nil means the JokerAI agent did it.
  def self.log!(project:, action:, actor: nil, task: nil, data: {})
    create!(project: project, task: task, actor: actor, action: action, data: data, created_at: Time.current)
  end
end

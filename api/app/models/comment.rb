class Comment < ApplicationRecord
  belongs_to :task
  belongs_to :author, class_name: "User", optional: true

  validates :body, presence: true, length: { maximum: 5000 }
end

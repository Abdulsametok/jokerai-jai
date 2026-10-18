class Section < ApplicationRecord
  KINDS = %w[todo doing review done custom].freeze

  belongs_to :project
  has_many :tasks, -> { order(:position, :id) }, dependent: :nullify, inverse_of: :section

  validates :name, presence: true, length: { maximum: 60 }
  validates :kind, inclusion: { in: KINDS }

  def done?
    kind == "done"
  end
end

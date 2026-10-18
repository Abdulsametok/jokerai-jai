class AgentRun < ApplicationRecord
  KINDS = %w[plan execute revise next_step status_update].freeze
  # USD per 1M tokens (input, output)
  PRICING = {
    "gpt-4o-mini" => [ 0.15, 0.60 ],
    "gpt-4.1-mini" => [ 0.40, 1.60 ],
    "gpt-4.1" => [ 2.00, 8.00 ],
    "gpt-4o" => [ 2.50, 10.00 ],
    "demo-offline" => [ 0.0, 0.0 ]
  }.freeze

  belongs_to :user, optional: true
  belongs_to :goal, optional: true
  belongs_to :task, optional: true

  validates :kind, inclusion: { in: KINDS }

  def self.cost_for(model, tokens_in, tokens_out)
    input, output = PRICING.find { |name, _| model.to_s.start_with?(name) }&.last || PRICING["gpt-4o-mini"]
    ((tokens_in * input) + (tokens_out * output)) / 1_000_000.0
  end
end

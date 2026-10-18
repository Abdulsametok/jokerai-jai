module Api
  # Runtime cost of the AI layer, straight from agent_runs.
  class AiUsageController < ApplicationController
    # Rough human effort each agent output replaces (minutes), for outcome-based pricing talk.
    MINUTES_SAVED = { "plan" => 60, "execute" => 45, "revise" => 15, "next_step" => 10 }.freeze

    def show
      runs = AgentRun.all
      ok = runs.where(status: "ok")
      by_kind = ok.group(:kind).pluck(:kind, Arel.sql("COUNT(*)"), Arel.sql("SUM(tokens_in)"), Arel.sql("SUM(tokens_out)"), Arel.sql("SUM(cost_usd)"))
      approved = Artifact.where(status: "approved").count
      cost = ok.sum(:cost_usd).to_f
      minutes = by_kind.sum { |kind, count, *| MINUTES_SAVED.fetch(kind, 0) * count }

      render json: {
        totals: {
          runs: runs.count,
          failed: runs.where(status: "error").count,
          tokens_in: ok.sum(:tokens_in),
          tokens_out: ok.sum(:tokens_out),
          cost_usd: cost.round(6),
          avg_duration_ms: ok.average(:duration_ms).to_i,
          approved_outputs: approved,
          cost_per_approved_output: approved.zero? ? nil : (cost / approved).round(6),
          estimated_minutes_saved: minutes
        },
        by_kind: by_kind.map do |kind, count, tin, tout, usd|
          { kind: kind, runs: count, tokens_in: tin.to_i, tokens_out: tout.to_i, cost_usd: usd.to_f.round(6) }
        end,
        models: ok.distinct.pluck(:model),
        recent: runs.includes(:task, :goal).order(created_at: :desc).limit(15).map do |run|
          {
            id: run.id, kind: run.kind, model: run.model, status: run.status,
            tokens_in: run.tokens_in.to_i, tokens_out: run.tokens_out.to_i, cost_usd: run.cost_usd.to_f,
            duration_ms: run.duration_ms.to_i, task: run.task&.title, goal: run.goal&.title, created_at: run.created_at
          }
        end
      }
    end
  end
end

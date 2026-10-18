# Single entry point for every LLM call. The API key is read from the server
# environment only; each call is recorded in agent_runs with tokens and cost.
module Llm
  class Error < StandardError; end

  Result = Struct.new(:data, :model, :tokens_in, :tokens_out, keyword_init: true)

  class << self
    attr_writer :client

    def client
      @client ||=
        if ENV["OPENAI_API_KEY"].present?
          OpenaiClient.new(api_key: ENV["OPENAI_API_KEY"], model: ENV.fetch("OPENAI_MODEL", "gpt-4o-mini"))
        elsif Rails.env.production?
          raise Error, "OPENAI_API_KEY tanımlı değil"
        else
          OfflineClient.new
        end
    end

    # Returns the parsed JSON hash produced by the model.
    def call(kind:, system:, user:, schema:, schema_name:, user_record: nil, goal: nil, task: nil)
      started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      result = client.complete(system: system, user: user, schema: schema, schema_name: schema_name)
      record(kind, started, result.model, result.tokens_in, result.tokens_out, user_record, goal, task)
      result.data
    rescue StandardError => e
      record(kind, started, client_model, 0, 0, user_record, goal, task, error: e)
      raise
    end

    private

    def client_model
      client.model
    rescue StandardError
      "unknown"
    end

    def record(kind, started, model, tokens_in, tokens_out, user_record, goal, task, error: nil)
      AgentRun.create!(
        kind: kind,
        model: model,
        tokens_in: tokens_in,
        tokens_out: tokens_out,
        cost_usd: AgentRun.cost_for(model, tokens_in, tokens_out),
        duration_ms: ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started) * 1000).round,
        status: error ? "error" : "ok",
        error: error&.message&.first(500),
        user: user_record,
        goal: goal,
        task: task
      )
    end
  end
end

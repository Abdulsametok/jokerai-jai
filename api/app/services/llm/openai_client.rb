require "net/http"

module Llm
  # Chat Completions with Structured Outputs (strict JSON schema).
  class OpenaiClient
    ENDPOINT = URI("https://api.openai.com/v1/chat/completions")

    attr_reader :model

    def initialize(api_key:, model:)
      @api_key = api_key
      @model = model
    end

    def complete(system:, user:, schema:, schema_name:)
      payload = {
        model: model,
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: schema_name, strict: true, schema: schema }
        }
      }

      response = post(payload)
      body = JSON.parse(response.body)
      raise Error, "OpenAI #{response.code}: #{body.dig('error', 'message')}" unless response.is_a?(Net::HTTPSuccess)

      message = body.dig("choices", 0, "message")
      raise Error, "Model isteği reddetti: #{message['refusal']}" if message["refusal"].present?

      Result.new(
        data: JSON.parse(message["content"]),
        model: body["model"] || model,
        tokens_in: body.dig("usage", "prompt_tokens").to_i,
        tokens_out: body.dig("usage", "completion_tokens").to_i
      )
    end

    private

    def post(payload)
      http = Net::HTTP.new(ENDPOINT.host, ENDPOINT.port)
      http.use_ssl = true
      http.open_timeout = 10
      http.read_timeout = 90
      request = Net::HTTP::Post.new(ENDPOINT)
      request["Authorization"] = "Bearer #{@api_key}"
      request["Content-Type"] = "application/json"
      request.body = payload.to_json
      http.request(request)
    end
  end
end

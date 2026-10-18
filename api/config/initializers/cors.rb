# Only the JokerAI frontend may call the API with credentials (session cookie).
allowed_origins = ENV.fetch("CORS_ORIGINS", "https://jokerai.abdulsametok.com,http://localhost:3000")
  .split(",").map(&:strip).reject(&:empty?)

Rails.application.config.x.allowed_origins = allowed_origins

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*allowed_origins)

    resource "/api/*",
      headers: :any,
      credentials: true,
      methods: %i[get post put patch delete options head]
  end
end

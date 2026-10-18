ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    parallelize(workers: 1)
  end
end

module ApiTestHelpers
  ORIGIN = "http://localhost:3000".freeze

  def seed_demo
    DemoSeed.run!
  end

  def user(key)
    User.find_by!(email: "#{key}@northwind.test")
  end

  def sign_in(key)
    post "/api/session", params: { email: "#{key}@northwind.test", password: DemoSeed::PASSWORD }, as: :json,
      headers: { "Origin" => ORIGIN }
    assert_response :created
  end

  def json_headers
    { "Origin" => ORIGIN }
  end

  def body
    response.parsed_body
  end
end

class ActionDispatch::IntegrationTest
  include ApiTestHelpers
end

require "test_helper"

class HealthTest < ActionDispatch::IntegrationTest
  test "health reports database status" do
    get "/api/health"
    assert_response :success
    assert_equal "ok", response.parsed_body["status"]
    assert_equal "ok", response.parsed_body["database"]
  end

  test "job check requires admin token" do
    post "/api/health/job_check"
    assert_response :unauthorized
  end

  test "job check enqueues and performs ping job" do
    ENV["ADMIN_TOKEN"] = "secret"
    perform_enqueued_jobs do
      post "/api/health/job_check", headers: { "X-Admin-Token" => "secret" }
    end
    assert_response :accepted

    get "/api/health/job_check/#{response.parsed_body['id']}", headers: { "X-Admin-Token" => "secret" }
    assert_equal "done", response.parsed_body["status"]
  ensure
    ENV.delete("ADMIN_TOKEN")
  end
end

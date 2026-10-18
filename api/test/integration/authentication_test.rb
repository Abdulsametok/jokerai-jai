require "test_helper"

class AuthenticationTest < ActionDispatch::IntegrationTest
  setup { seed_demo }

  test "wrong password is rejected" do
    post "/api/session", params: { email: "deniz@northwind.test", password: "yanlis-parola" }, as: :json
    assert_response :unauthorized
    assert_nil cookies[:jokerai_session].presence
  end

  test "login sets an HttpOnly SameSite cookie and never returns the token in the body" do
    sign_in :deniz
    set_cookie = response.headers["Set-Cookie"].to_s
    assert_match(/jokerai_session=/, set_cookie)
    assert_match(/httponly/i, set_cookie)
    assert_match(/samesite=lax/i, set_cookie)

    token = cookies[:jokerai_session]
    assert token.present?
    assert_not_includes response.body, token
    assert_equal Session.digest(token), Session.last.token_digest
    assert_not_equal token, Session.last.token_digest
  end

  test "passwords are stored as bcrypt hashes" do
    digest = user(:deniz).password_digest
    assert digest.start_with?("$2")
    assert_not_includes digest, DemoSeed::PASSWORD
  end

  test "me works with session and logout destroys it server-side" do
    sign_in :deniz
    get "/api/me"
    assert_response :success
    assert_equal "Deniz Arslan", body["user"]["name"]

    assert_difference -> { Session.count }, -1 do
      delete "/api/session", headers: json_headers
    end
    get "/api/me"
    assert_response :unauthorized
  end

  test "expired sessions are not accepted" do
    sign_in :deniz
    Session.last.update!(expires_at: 1.minute.ago)
    get "/api/me"
    assert_response :unauthorized
  end

  test "protected endpoints require a session" do
    get "/api/projects"
    assert_response :unauthorized
  end

  test "state-changing requests from foreign origins are refused" do
    sign_in :deniz
    post "/api/projects", params: { project: { name: "Saldırı" } }, as: :json, headers: { "Origin" => "https://evil.example.com" }
    assert_response :forbidden
    assert_nil Project.find_by(name: "Saldırı")
  end
end

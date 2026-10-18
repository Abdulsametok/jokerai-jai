require "test_helper"

# Ece is only a member of the peak-season project; she must not be able to
# see or touch anything in the last-mile project.
class AuthorizationTest < ActionDispatch::IntegrationTest
  setup do
    seed_demo
    @own = Project.find_by!(name: "Q4 Yoğun Sezon Hazırlığı - İstanbul Aktarma Merkezi")
    @foreign = Project.find_by!(name: "Son Mil Teslimat SLA İyileştirme")
    @foreign_task = @foreign.tasks.first
    sign_in :ece
  end

  test "project list only contains own projects" do
    get "/api/projects"
    names = body["projects"].map { |p| p["name"] }
    assert_includes names, @own.name
    assert_not_includes names, @foreign.name
  end

  test "foreign project and task are not found" do
    get "/api/projects/#{@foreign.id}"
    assert_response :not_found
    get "/api/tasks/#{@foreign_task.id}"
    assert_response :not_found
  end

  test "foreign task cannot be updated, moved, commented or deleted" do
    patch "/api/tasks/#{@foreign_task.id}", params: { task: { title: "Ele geçirildi" } }, as: :json, headers: json_headers
    assert_response :not_found
    post "/api/tasks/#{@foreign_task.id}/move", params: { section_id: @foreign.sections.last.id, position: 0 }, as: :json, headers: json_headers
    assert_response :not_found
    post "/api/tasks/#{@foreign_task.id}/comments", params: { body: "merhaba" }, as: :json, headers: json_headers
    assert_response :not_found
    delete "/api/tasks/#{@foreign_task.id}", headers: json_headers
    assert_response :not_found
    assert_not_equal "Ele geçirildi", @foreign_task.reload.title
  end

  test "cannot create tasks in a foreign project" do
    post "/api/projects/#{@foreign.id}/tasks", params: { task: { title: "Sızma" } }, as: :json, headers: json_headers
    assert_response :not_found
  end

  test "cannot move a task into another project's section" do
    task = @own.tasks.top_level.first
    post "/api/tasks/#{task.id}/move", params: { section_id: @foreign.sections.first.id, position: 0 }, as: :json, headers: json_headers
    assert_response :not_found
  end

  test "members cannot edit project settings, members or delete the project" do
    patch "/api/projects/#{@own.id}", params: { project: { name: "Yeni ad" } }, as: :json, headers: json_headers
    assert_response :forbidden
    post "/api/projects/#{@own.id}/members", params: { user_id: user(:zeynep).id }, as: :json, headers: json_headers
    assert_response :forbidden
    delete "/api/projects/#{@own.id}", headers: json_headers
    assert_response :forbidden
  end

  test "notifications of other users cannot be marked read" do
    other = user(:deniz).notifications.first
    post "/api/notifications/#{other.id}/read", headers: json_headers
    assert_response :not_found
    assert_nil other.reload.read_at
  end
end

class ApplicationController < ActionController::API
  include ActionController::Cookies
  include OriginCheck
  include Authentication

  class Forbidden < StandardError; end

  rescue_from ActiveRecord::RecordNotFound do
    render json: { error: "Kayıt bulunamadı" }, status: :not_found
  end

  rescue_from ActiveRecord::RecordInvalid do |e|
    render json: { error: e.record.errors.full_messages.to_sentence, errors: e.record.errors.to_hash }, status: :unprocessable_entity
  end

  rescue_from ActionController::ParameterMissing do |e|
    render json: { error: e.message }, status: :bad_request
  end

  rescue_from Forbidden do |e|
    render json: { error: e.message.presence || "Bu işlem için yetkiniz yok" }, status: :forbidden
  end

  private

  # Every lookup goes through the current user's memberships, so records in
  # projects the user is not part of are simply not found (404).
  def find_project!(id)
    current_user.projects.find(id)
  end

  def find_task!(id)
    Task.accessible_by(current_user).find(id)
  end

  def require_manager!(project)
    raise Forbidden, "Bu işlem için proje sahibi veya yöneticisi olmalısınız" unless project.manager?(current_user)
  end

  def admin_token_valid?
    expected = ENV["ADMIN_TOKEN"].to_s
    given = request.headers["X-Admin-Token"].to_s
    expected.present? && ActiveSupport::SecurityUtils.secure_compare(expected, given)
  end
end

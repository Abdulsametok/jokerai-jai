# CSRF defence for cookie auth: state-changing requests coming from a browser
# must originate from an allowed frontend origin (SameSite=Lax covers the rest).
module OriginCheck
  extend ActiveSupport::Concern

  included do
    before_action :verify_request_origin
  end

  private

  def verify_request_origin
    return if request.get? || request.head? || request.options?

    origin = request.headers["Origin"]
    return if origin.blank? || Rails.application.config.x.allowed_origins.include?(origin)

    render json: { error: "İzin verilmeyen istek kaynağı" }, status: :forbidden
  end
end

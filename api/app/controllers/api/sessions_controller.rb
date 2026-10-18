module Api
  class SessionsController < ApplicationController
    allow_unauthenticated_access only: :create
    rate_limit to: 10, within: 3.minutes, only: :create,
      with: -> { render json: { error: "Çok fazla deneme. Birkaç dakika sonra tekrar deneyin." }, status: :too_many_requests }

    def show
      render json: { user: ApiJson.me(current_user) }
    end

    def create
      user = User.authenticate_by(email: params.require(:email), password: params.require(:password))
      if user
        start_new_session_for(user)
        render json: { user: ApiJson.me(user) }, status: :created
      else
        render json: { error: "E-posta veya parola hatalı" }, status: :unauthorized
      end
    end

    def destroy
      terminate_session
      head :no_content
    end
  end
end

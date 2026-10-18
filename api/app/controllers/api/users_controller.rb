module Api
  class UsersController < ApplicationController
    allow_unauthenticated_access only: :create
    rate_limit to: 5, within: 10.minutes, only: :create,
      with: -> { render json: { error: "Çok fazla kayıt denemesi" }, status: :too_many_requests }

    # Company directory, used for assignment and @mentions.
    def index
      users = User.includes(:team).order(:name)
      render json: { users: users.map { |u| ApiJson.user(u) } }
    end

    def create
      user = User.new(params.permit(:name, :email, :password).merge(team: Team.first, title: "Yeni üye"))
      user.save!
      start_new_session_for(user)
      render json: { user: ApiJson.me(user) }, status: :created
    end
  end
end

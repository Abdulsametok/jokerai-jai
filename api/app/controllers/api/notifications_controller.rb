module Api
  class NotificationsController < ApplicationController
    def index
      notifications = current_user.notifications.includes(:actor, :task, :project).order(created_at: :desc).limit(50)
      render json: {
        notifications: notifications.map { |n| ApiJson.notification(n) },
        unread: current_user.notifications.unread.count
      }
    end

    def read
      current_user.notifications.find(params[:id]).update!(read_at: Time.current)
      head :no_content
    end

    def read_all
      current_user.notifications.unread.update_all(read_at: Time.current)
      head :no_content
    end
  end
end

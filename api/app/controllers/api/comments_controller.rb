module Api
  class CommentsController < ApplicationController
    def create
      task = find_task!(params[:task_id])
      comment = task.comments.create!(author: current_user, body: params.require(:body))
      Activity.log!(project: task.project, task: task, actor: current_user, action: "comment_added")

      mentioned = mentioned_users(task)
      mentioned.each do |user|
        task.project.ensure_member!(user)
        Notification.notify!(user: user, actor: current_user, kind: "mentioned", task: task,
          message: "#{current_user.name} sizden bahsetti: #{task.title}")
      end

      followers = [ task.assignee, task.creator ].compact.uniq - mentioned
      followers.each do |user|
        Notification.notify!(user: user, actor: current_user, kind: "commented", task: task,
          message: "#{current_user.name} yorum yaptı: #{task.title}")
      end

      render json: { comment: ApiJson.comment(comment) }, status: :created
    end

    private

    # The frontend mention picker sends ids; only users actually named in the body count.
    def mentioned_users(task)
      ids = Array(params[:mentioned_user_ids]).map(&:to_i).uniq
      return [] if ids.empty?

      User.where(id: ids).select { |user| params[:body].to_s.include?("@#{user.name}") }
    end
  end
end

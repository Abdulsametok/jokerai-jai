module TaskEvents
  module_function

  def completed(task, actor)
    Activity.log!(project: task.project, task: task, actor: actor, action: "task_completed", data: { title: task.title })
    if task.creator && task.creator != actor
      Notification.notify!(user: task.creator, actor: actor, kind: "completed", task: task,
        message: "#{actor&.name || 'JokerAI'} bir görevi tamamladı: #{task.title}")
    end
    AgentPipeline.after_completion(task)
  end
end

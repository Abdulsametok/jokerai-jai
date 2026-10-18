module ApiJson
  module_function

  def user(user)
    return nil unless user

    {
      id: user.id,
      name: user.name,
      email: user.email,
      title: user.title,
      initials: user.initials,
      avatar_color: user.avatar_color,
      team: user.team&.name
    }
  end

  def me(user)
    user(user).merge(unread_notifications: user.notifications.unread.count)
  end

  def project_summary(project, viewer)
    {
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      due_on: project.due_on,
      owner: user(project.owner),
      role: project.role_for(viewer),
      progress: project.progress,
      member_count: project.project_memberships.size,
      from_goal: project.goal.present?,
      updated_at: project.updated_at
    }
  end

  def project_detail(project, viewer)
    tasks = project.tasks.top_level.includes(:assignee, :subtasks, :artifacts).order(:position, :id).to_a
    project_summary(project, viewer).merge(
      goal: project.goal && { id: project.goal.id, title: project.goal.title },
      members: project.project_memberships.includes(:user).map { |m| user(m.user).merge(role: m.role) },
      sections: project.sections.map { |s| section(s) },
      tasks: tasks.map { |t| task(t) }
    )
  end

  def section(section)
    { id: section.id, name: section.name, kind: section.kind, position: section.position }
  end

  def task(task)
    subtasks = task.subtasks.to_a
    latest = task.artifacts.max_by(&:version)
    {
      id: task.id,
      project_id: task.project_id,
      section_id: task.section_id,
      parent_id: task.parent_id,
      depends_on_id: task.depends_on_id,
      title: task.title,
      description: task.description,
      due_on: task.due_on,
      priority: task.priority,
      position: task.position,
      completed: task.completed?,
      completed_at: task.completed_at,
      assignee: user(task.assignee),
      subtask_count: subtasks.size,
      subtask_done: subtasks.count(&:completed?),
      agent_executable: task.agent_executable,
      agent_kind: task.agent_kind,
      agent_state: task.agent_state,
      latest_artifact_status: latest&.status,
      created_at: task.created_at
    }
  end

  def task_detail(task, viewer)
    task(task).merge(
      project: { id: task.project.id, name: task.project.name, color: task.project.color },
      can_review: task.project.manager?(viewer),
      parent: task.parent && { id: task.parent.id, title: task.parent.title },
      depends_on: task.depends_on && { id: task.depends_on.id, title: task.depends_on.title, completed: task.depends_on.completed? },
      creator: user(task.creator),
      subtasks: task.subtasks.includes(:assignee, :artifacts, :subtasks).map { |t| task(t) },
      comments: task.comments.includes(:author).map { |c| comment(c) },
      artifacts: task.artifacts.map { |a| artifact(a) },
      activities: task.activities.includes(:actor).order(created_at: :desc).limit(30).map { |a| activity(a) }
    )
  end

  def comment(comment)
    {
      id: comment.id,
      task_id: comment.task_id,
      body: comment.body,
      by_agent: comment.by_agent,
      author: user(comment.author),
      created_at: comment.created_at
    }
  end

  def activity(activity)
    {
      id: activity.id,
      action: activity.action,
      data: activity.data,
      actor: user(activity.actor),
      by_agent: activity.actor_id.nil?,
      task_id: activity.task_id,
      created_at: activity.created_at
    }
  end

  def notification(notification)
    {
      id: notification.id,
      kind: notification.kind,
      message: notification.message,
      read: notification.read_at.present?,
      actor: user(notification.actor),
      task: notification.task && { id: notification.task.id, title: notification.task.title },
      project: notification.project && { id: notification.project.id, name: notification.project.name },
      created_at: notification.created_at
    }
  end

  def artifact(artifact)
    {
      id: artifact.id,
      task_id: artifact.task_id,
      version: artifact.version,
      kind: artifact.kind,
      title: artifact.title,
      content: artifact.content,
      status: artifact.status,
      feedback: artifact.feedback,
      reviewed_by: user(artifact.reviewed_by),
      reviewed_at: artifact.reviewed_at,
      created_at: artifact.created_at
    }
  end

  def goal(goal)
    {
      id: goal.id,
      title: goal.title,
      context: goal.context,
      deadline: goal.deadline,
      status: goal.status,
      plan: goal.plan,
      error: goal.error,
      project_id: goal.project_id,
      created_at: goal.created_at
    }
  end
end

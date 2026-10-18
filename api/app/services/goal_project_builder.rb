# Materializes an accepted plan as a real project and immediately starts the
# agent on every agent-executable task whose dependencies are already met.
class GoalProjectBuilder
  def initialize(goal, actor, excluded_refs: [], assignee_overrides: {})
    @goal = goal
    @actor = actor
    @excluded = excluded_refs.map(&:to_s)
    @overrides = assignee_overrides.to_h.transform_keys(&:to_s)
  end

  def call
    plan = @goal.plan
    project = nil
    Project.transaction do
      project = Project.create!(
        owner: @actor,
        name: plan["project_name"].presence || @goal.title.first(120),
        description: [ plan["summary"], risks_text(plan) ].compact_blank.join("\n\n"),
        color: Project::COLORS.sample,
        due_on: @goal.deadline
      )
      tasks_by_ref = create_tasks(project, plan)
      @goal.update!(project: project, status: "accepted")
      Activity.log!(project: project, action: "project_from_goal", data: { goal: @goal.title, tasks: tasks_by_ref.size })
      notify_assignees(tasks_by_ref.values)
    end
    start_ready_agent_tasks(project)
    project
  end

  private

  def risks_text(plan)
    risks = Array(plan["risks"])
    "Riskler: #{risks.join('; ')}" if risks.any?
  end

  def create_tasks(project, plan)
    todo = project.section_of_kind("todo")
    tasks_by_ref = {}
    Array(plan["tasks"]).each do |item|
      next if @excluded.include?(item["ref"])

      assignee = User.find_by(id: @overrides.fetch(item["ref"], item["assignee_id"]))
      task = project.tasks.create!(
        section: todo,
        title: item["title"],
        description: item["description"],
        assignee: assignee,
        creator: @actor,
        due_on: Date.current + item["due_in_days"].to_i,
        priority: item["priority"],
        agent_executable: item["agent_executable"],
        agent_kind: item["agent_kind"]
      )
      project.ensure_member!(assignee) if assignee
      Array(item["subtasks"]).each do |title|
        project.tasks.create!(section: todo, parent: task, title: title, assignee: assignee, creator: @actor)
      end
      tasks_by_ref[item["ref"]] = task
    end
    Array(plan["tasks"]).each do |item|
      task = tasks_by_ref[item["ref"]]
      dependency = tasks_by_ref[item["depends_on"]]
      task.update!(depends_on: dependency) if task && dependency
    end
    tasks_by_ref
  end

  def notify_assignees(tasks)
    tasks.each do |task|
      next unless task.assignee

      message =
        if task.agent_executable
          "JokerAI '#{task.title}' görevini sizin adınıza hazırlıyor; çıktı onaya gelecek."
        else
          "JokerAI size yeni bir görev atadı: #{task.title}"
        end
      Notification.notify!(user: task.assignee, actor: nil, kind: "assigned", task: task, message: message)
    end
  end

  def start_ready_agent_tasks(project)
    project.tasks.top_level.where(agent_executable: true, agent_state: "idle").find_each do |task|
      next if task.depends_on && !task.depends_on.completed?

      AgentPipeline.enqueue_execution(task)
    end
  end
end

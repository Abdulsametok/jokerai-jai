# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_10_18_020300) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "activities", force: :cascade do |t|
    t.bigint "project_id", null: false
    t.bigint "task_id"
    t.bigint "actor_id"
    t.string "action", null: false
    t.jsonb "data", default: {}, null: false
    t.datetime "created_at", null: false
    t.index ["actor_id"], name: "index_activities_on_actor_id"
    t.index ["project_id"], name: "index_activities_on_project_id"
    t.index ["task_id"], name: "index_activities_on_task_id"
  end

  create_table "agent_runs", force: :cascade do |t|
    t.bigint "user_id"
    t.bigint "goal_id"
    t.bigint "task_id"
    t.string "kind", null: false
    t.string "model", null: false
    t.integer "tokens_in", default: 0, null: false
    t.integer "tokens_out", default: 0, null: false
    t.decimal "cost_usd", precision: 12, scale: 6, default: "0.0", null: false
    t.integer "duration_ms", default: 0, null: false
    t.string "status", default: "ok", null: false
    t.text "error"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["goal_id"], name: "index_agent_runs_on_goal_id"
    t.index ["task_id"], name: "index_agent_runs_on_task_id"
    t.index ["user_id"], name: "index_agent_runs_on_user_id"
  end

  create_table "artifacts", force: :cascade do |t|
    t.bigint "task_id", null: false
    t.bigint "agent_run_id"
    t.bigint "reviewed_by_id"
    t.integer "version", default: 1, null: false
    t.string "kind", null: false
    t.string "title", null: false
    t.text "content", null: false
    t.string "status", default: "pending_review", null: false
    t.text "feedback"
    t.datetime "reviewed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["agent_run_id"], name: "index_artifacts_on_agent_run_id"
    t.index ["reviewed_by_id"], name: "index_artifacts_on_reviewed_by_id"
    t.index ["task_id", "version"], name: "index_artifacts_on_task_id_and_version", unique: true
    t.index ["task_id"], name: "index_artifacts_on_task_id"
  end

  create_table "comments", force: :cascade do |t|
    t.bigint "task_id", null: false
    t.bigint "author_id"
    t.text "body", null: false
    t.boolean "by_agent", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_comments_on_author_id"
    t.index ["task_id"], name: "index_comments_on_task_id"
  end

  create_table "goals", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "project_id"
    t.string "title", null: false
    t.text "context"
    t.date "deadline"
    t.string "status", default: "planning", null: false
    t.jsonb "plan", default: {}, null: false
    t.text "error"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_goals_on_project_id"
    t.index ["user_id"], name: "index_goals_on_user_id"
  end

  create_table "job_checks", force: :cascade do |t|
    t.datetime "enqueued_at", null: false
    t.datetime "performed_at"
    t.string "performed_by"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "notifications", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "actor_id"
    t.bigint "task_id"
    t.bigint "project_id"
    t.string "kind", null: false
    t.string "message", null: false
    t.datetime "read_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["actor_id"], name: "index_notifications_on_actor_id"
    t.index ["project_id"], name: "index_notifications_on_project_id"
    t.index ["task_id"], name: "index_notifications_on_task_id"
    t.index ["user_id", "read_at"], name: "index_notifications_on_user_id_and_read_at"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "project_memberships", force: :cascade do |t|
    t.bigint "project_id", null: false
    t.bigint "user_id", null: false
    t.string "role", default: "member", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id", "user_id"], name: "index_project_memberships_on_project_id_and_user_id", unique: true
    t.index ["project_id"], name: "index_project_memberships_on_project_id"
    t.index ["user_id"], name: "index_project_memberships_on_user_id"
  end

  create_table "projects", force: :cascade do |t|
    t.bigint "owner_id", null: false
    t.string "name", null: false
    t.text "description"
    t.string "color", default: "#65a30d", null: false
    t.date "due_on"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["owner_id"], name: "index_projects_on_owner_id"
  end

  create_table "sections", force: :cascade do |t|
    t.bigint "project_id", null: false
    t.string "name", null: false
    t.string "kind", default: "custom", null: false
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_sections_on_project_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "token_digest", null: false
    t.datetime "expires_at", null: false
    t.datetime "last_seen_at"
    t.string "user_agent"
    t.string "ip_address"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["token_digest"], name: "index_sessions_on_token_digest", unique: true
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "solid_queue_batch_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.bigint "batch_id", null: false
    t.datetime "created_at", null: false
    t.index ["batch_id"], name: "index_solid_queue_batch_executions_on_batch_id"
    t.index ["job_id"], name: "index_solid_queue_batch_executions_on_job_id", unique: true
  end

  create_table "solid_queue_batches", force: :cascade do |t|
    t.string "active_job_batch_id"
    t.string "description"
    t.text "on_finish"
    t.text "on_success"
    t.text "on_failure"
    t.text "metadata"
    t.integer "total_jobs", default: 0, null: false
    t.integer "completed_jobs", default: 0, null: false
    t.integer "failed_jobs", default: 0, null: false
    t.datetime "enqueued_at"
    t.datetime "finished_at"
    t.datetime "failed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active_job_batch_id"], name: "index_solid_queue_batches_on_active_job_batch_id", unique: true
    t.index ["finished_at"], name: "index_solid_queue_batches_on_finished_at"
  end

  create_table "solid_queue_blocked_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.string "concurrency_key", null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.index ["concurrency_key", "priority", "job_id"], name: "index_solid_queue_blocked_executions_for_release"
    t.index ["expires_at", "concurrency_key"], name: "index_solid_queue_blocked_executions_for_maintenance"
    t.index ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id", unique: true
  end

  create_table "solid_queue_claimed_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id", unique: true
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
  end

  create_table "solid_queue_failed_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.text "error"
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_failed_executions_on_job_id", unique: true
  end

  create_table "solid_queue_jobs", force: :cascade do |t|
    t.string "queue_name", null: false
    t.string "class_name", null: false
    t.text "arguments"
    t.integer "priority", default: 0, null: false
    t.string "active_job_id"
    t.datetime "scheduled_at"
    t.datetime "finished_at"
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "batch_id"
    t.index ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id"
    t.index ["batch_id"], name: "index_solid_queue_jobs_on_batch_id"
    t.index ["class_name"], name: "index_solid_queue_jobs_on_class_name"
    t.index ["finished_at"], name: "index_solid_queue_jobs_on_finished_at"
    t.index ["queue_name", "finished_at"], name: "index_solid_queue_jobs_for_filtering"
    t.index ["scheduled_at", "finished_at"], name: "index_solid_queue_jobs_for_alerting"
  end

  create_table "solid_queue_pauses", force: :cascade do |t|
    t.string "queue_name", null: false
    t.datetime "created_at", null: false
    t.index ["queue_name"], name: "index_solid_queue_pauses_on_queue_name", unique: true
  end

  create_table "solid_queue_processes", force: :cascade do |t|
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.bigint "supervisor_id"
    t.integer "pid", null: false
    t.string "hostname"
    t.text "metadata"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.index ["last_heartbeat_at"], name: "index_solid_queue_processes_on_last_heartbeat_at"
    t.index ["name", "supervisor_id"], name: "index_solid_queue_processes_on_name_and_supervisor_id", unique: true
    t.index ["supervisor_id"], name: "index_solid_queue_processes_on_supervisor_id"
  end

  create_table "solid_queue_ready_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_ready_executions_on_job_id", unique: true
    t.index ["priority", "job_id"], name: "index_solid_queue_poll_all"
    t.index ["queue_name", "priority", "job_id"], name: "index_solid_queue_poll_by_queue"
  end

  create_table "solid_queue_recurring_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "task_key", null: false
    t.datetime "run_at", null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_recurring_executions_on_job_id", unique: true
    t.index ["task_key", "run_at"], name: "index_solid_queue_recurring_executions_on_task_key_and_run_at", unique: true
  end

  create_table "solid_queue_recurring_tasks", force: :cascade do |t|
    t.string "key", null: false
    t.string "schedule", null: false
    t.string "command", limit: 2048
    t.string "class_name"
    t.text "arguments"
    t.string "queue_name"
    t.integer "priority", default: 0
    t.boolean "static", default: true, null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_solid_queue_recurring_tasks_on_key", unique: true
    t.index ["static"], name: "index_solid_queue_recurring_tasks_on_static"
  end

  create_table "solid_queue_scheduled_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.datetime "scheduled_at", null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id", unique: true
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_dispatch_all"
  end

  create_table "solid_queue_semaphores", force: :cascade do |t|
    t.string "key", null: false
    t.integer "value", default: 1, null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_solid_queue_semaphores_on_expires_at"
    t.index ["key", "value"], name: "index_solid_queue_semaphores_on_key_and_value"
    t.index ["key"], name: "index_solid_queue_semaphores_on_key", unique: true
  end

  create_table "tasks", force: :cascade do |t|
    t.bigint "project_id", null: false
    t.bigint "section_id"
    t.bigint "parent_id"
    t.bigint "depends_on_id"
    t.bigint "assignee_id"
    t.bigint "creator_id"
    t.string "title", null: false
    t.text "description"
    t.date "due_on"
    t.string "priority", default: "medium", null: false
    t.integer "position", default: 0, null: false
    t.datetime "completed_at"
    t.boolean "agent_executable", default: false, null: false
    t.string "agent_kind"
    t.string "agent_state", default: "idle", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["assignee_id", "completed_at"], name: "index_tasks_on_assignee_id_and_completed_at"
    t.index ["assignee_id"], name: "index_tasks_on_assignee_id"
    t.index ["creator_id"], name: "index_tasks_on_creator_id"
    t.index ["depends_on_id"], name: "index_tasks_on_depends_on_id"
    t.index ["parent_id"], name: "index_tasks_on_parent_id"
    t.index ["project_id"], name: "index_tasks_on_project_id"
    t.index ["section_id", "position"], name: "index_tasks_on_section_id_and_position"
    t.index ["section_id"], name: "index_tasks_on_section_id"
  end

  create_table "teams", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_teams_on_name", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.bigint "team_id"
    t.string "name", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "title"
    t.string "skills", default: [], null: false, array: true
    t.string "avatar_color", default: "#65a30d", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["team_id"], name: "index_users_on_team_id"
  end

  add_foreign_key "activities", "projects", on_delete: :cascade
  add_foreign_key "activities", "tasks", on_delete: :cascade
  add_foreign_key "activities", "users", column: "actor_id", on_delete: :nullify
  add_foreign_key "agent_runs", "goals", on_delete: :nullify
  add_foreign_key "agent_runs", "tasks", on_delete: :nullify
  add_foreign_key "agent_runs", "users", on_delete: :nullify
  add_foreign_key "artifacts", "agent_runs", on_delete: :nullify
  add_foreign_key "artifacts", "tasks", on_delete: :cascade
  add_foreign_key "artifacts", "users", column: "reviewed_by_id", on_delete: :nullify
  add_foreign_key "comments", "tasks", on_delete: :cascade
  add_foreign_key "comments", "users", column: "author_id", on_delete: :nullify
  add_foreign_key "goals", "projects", on_delete: :nullify
  add_foreign_key "goals", "users", on_delete: :cascade
  add_foreign_key "notifications", "projects", on_delete: :cascade
  add_foreign_key "notifications", "tasks", on_delete: :cascade
  add_foreign_key "notifications", "users", column: "actor_id", on_delete: :nullify
  add_foreign_key "notifications", "users", on_delete: :cascade
  add_foreign_key "project_memberships", "projects", on_delete: :cascade
  add_foreign_key "project_memberships", "users", on_delete: :cascade
  add_foreign_key "projects", "users", column: "owner_id"
  add_foreign_key "sections", "projects", on_delete: :cascade
  add_foreign_key "sessions", "users", on_delete: :cascade
  add_foreign_key "solid_queue_batch_executions", "solid_queue_batches", column: "batch_id", on_delete: :cascade
  add_foreign_key "solid_queue_batch_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_recurring_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "tasks", "projects", on_delete: :cascade
  add_foreign_key "tasks", "sections", on_delete: :nullify
  add_foreign_key "tasks", "tasks", column: "depends_on_id", on_delete: :nullify
  add_foreign_key "tasks", "tasks", column: "parent_id", on_delete: :cascade
  add_foreign_key "tasks", "users", column: "assignee_id", on_delete: :nullify
  add_foreign_key "tasks", "users", column: "creator_id", on_delete: :nullify
  add_foreign_key "users", "teams"
end

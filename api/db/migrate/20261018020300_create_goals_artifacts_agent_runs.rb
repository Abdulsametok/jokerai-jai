class CreateGoalsArtifactsAgentRuns < ActiveRecord::Migration[8.1]
  def change
    create_table :goals do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.references :project, foreign_key: { on_delete: :nullify }
      t.string :title, null: false
      t.text :context
      t.date :deadline
      t.string :status, null: false, default: "planning"
      t.jsonb :plan, null: false, default: {}
      t.text :error
      t.timestamps
    end

    create_table :agent_runs do |t|
      t.references :user, foreign_key: { on_delete: :nullify }
      t.references :goal, foreign_key: { on_delete: :nullify }
      t.references :task, foreign_key: { on_delete: :nullify }
      t.string :kind, null: false
      t.string :model, null: false
      t.integer :tokens_in, null: false, default: 0
      t.integer :tokens_out, null: false, default: 0
      t.decimal :cost_usd, precision: 12, scale: 6, null: false, default: 0
      t.integer :duration_ms, null: false, default: 0
      t.string :status, null: false, default: "ok"
      t.text :error
      t.timestamps
    end

    create_table :artifacts do |t|
      t.references :task, null: false, foreign_key: { on_delete: :cascade }
      t.references :agent_run, foreign_key: { on_delete: :nullify }
      t.references :reviewed_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.integer :version, null: false, default: 1
      t.string :kind, null: false
      t.string :title, null: false
      t.text :content, null: false
      t.string :status, null: false, default: "pending_review"
      t.text :feedback
      t.datetime :reviewed_at
      t.timestamps
    end
    add_index :artifacts, %i[task_id version], unique: true
  end
end

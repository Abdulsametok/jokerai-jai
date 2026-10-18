class CreateProjectsSectionsTasks < ActiveRecord::Migration[8.1]
  def change
    create_table :projects do |t|
      t.references :owner, null: false, foreign_key: { to_table: :users }
      t.string :name, null: false
      t.text :description
      t.string :color, null: false, default: "#65a30d"
      t.date :due_on
      t.timestamps
    end

    create_table :project_memberships do |t|
      t.references :project, null: false, foreign_key: { on_delete: :cascade }
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.string :role, null: false, default: "member"
      t.timestamps
    end
    add_index :project_memberships, %i[project_id user_id], unique: true

    create_table :sections do |t|
      t.references :project, null: false, foreign_key: { on_delete: :cascade }
      t.string :name, null: false
      t.string :kind, null: false, default: "custom"
      t.integer :position, null: false, default: 0
      t.timestamps
    end

    create_table :tasks do |t|
      t.references :project, null: false, foreign_key: { on_delete: :cascade }
      t.references :section, foreign_key: { on_delete: :nullify }
      t.references :parent, foreign_key: { to_table: :tasks, on_delete: :cascade }
      t.references :depends_on, foreign_key: { to_table: :tasks, on_delete: :nullify }
      t.references :assignee, foreign_key: { to_table: :users, on_delete: :nullify }
      t.references :creator, foreign_key: { to_table: :users, on_delete: :nullify }
      t.string :title, null: false
      t.text :description
      t.date :due_on
      t.string :priority, null: false, default: "medium"
      t.integer :position, null: false, default: 0
      t.datetime :completed_at
      t.boolean :agent_executable, null: false, default: false
      t.string :agent_kind
      t.string :agent_state, null: false, default: "idle"
      t.timestamps
    end
    add_index :tasks, %i[section_id position]
    add_index :tasks, %i[assignee_id completed_at]
  end
end

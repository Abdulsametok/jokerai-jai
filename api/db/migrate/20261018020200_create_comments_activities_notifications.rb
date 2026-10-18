class CreateCommentsActivitiesNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :comments do |t|
      t.references :task, null: false, foreign_key: { on_delete: :cascade }
      t.references :author, foreign_key: { to_table: :users, on_delete: :nullify }
      t.text :body, null: false
      t.boolean :by_agent, null: false, default: false
      t.timestamps
    end

    create_table :activities do |t|
      t.references :project, null: false, foreign_key: { on_delete: :cascade }
      t.references :task, foreign_key: { on_delete: :cascade }
      t.references :actor, foreign_key: { to_table: :users, on_delete: :nullify }
      t.string :action, null: false
      t.jsonb :data, null: false, default: {}
      t.datetime :created_at, null: false
    end

    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.references :actor, foreign_key: { to_table: :users, on_delete: :nullify }
      t.references :task, foreign_key: { on_delete: :cascade }
      t.references :project, foreign_key: { on_delete: :cascade }
      t.string :kind, null: false
      t.string :message, null: false
      t.datetime :read_at
      t.timestamps
    end
    add_index :notifications, %i[user_id read_at]
  end
end

class CreateTeamsUsersSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :teams do |t|
      t.string :name, null: false
      t.timestamps
    end
    add_index :teams, :name, unique: true

    create_table :users do |t|
      t.references :team, foreign_key: true
      t.string :name, null: false
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :title
      t.string :skills, array: true, default: [], null: false
      t.string :avatar_color, null: false, default: "#65a30d"
      t.timestamps
    end
    add_index :users, :email, unique: true

    create_table :sessions do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.string :token_digest, null: false
      t.datetime :expires_at, null: false
      t.datetime :last_seen_at
      t.string :user_agent
      t.string :ip_address
      t.timestamps
    end
    add_index :sessions, :token_digest, unique: true
  end
end

class CreateJobChecks < ActiveRecord::Migration[8.1]
  def change
    create_table :job_checks do |t|
      t.datetime :enqueued_at, null: false
      t.datetime :performed_at
      t.string :performed_by

      t.timestamps
    end
  end
end

class CreateSecurityAuditEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :security_audit_events do |t|
      t.references :actor, null: false, foreign_key: { to_table: :staffs }
      t.references :subject, null: false, foreign_key: { to_table: :staffs }
      t.string :action, null: false
      t.datetime :created_at, null: false
    end
  end
end

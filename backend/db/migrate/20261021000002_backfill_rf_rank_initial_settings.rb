class BackfillRfRankInitialSettings < ActiveRecord::Migration[8.1]
  def up
    # 移行時だけ旧コードを参照し、従来の「初期色へ戻す」の色を引き継ぐ。
    execute <<~SQL
      UPDATE standard_list_masters AS ranks
      SET initial_display_color = CASE ranks.code
        WHEN 'A' THEN '#059669'
        WHEN 'B' THEN '#0D9488'
        WHEN 'C' THEN '#2563EB'
        WHEN 'D' THEN '#D97706'
        WHEN 'E' THEN '#EA580C'
        WHEN 'Z' THEN '#64748B'
        WHEN 'N' THEN '#94A3B8'
        ELSE '#64748B'
      END
      FROM standard_masters AS masters
      WHERE ranks.standard_master_id = masters.id
        AND masters.system_key = 'rf_rank'
        AND ranks.initial_display_color IS NULL
    SQL

    return unless connection.select_value(<<~SQL)
      SELECT id FROM rf_rule_sets WHERE no_visit_rank_id IS NULL LIMIT 1
    SQL

    rank_ids = connection.select_values(<<~SQL)
      SELECT ranks.id
      FROM standard_list_masters AS ranks
      INNER JOIN standard_masters AS masters
        ON masters.id = ranks.standard_master_id
      WHERE masters.system_key = 'rf_rank'
        AND masters.active = TRUE
        AND ranks.active = TRUE
        AND ranks.code = 'N'
    SQL

    unless rank_ids.one?
      raise ActiveRecord::MigrationError,
            "来店履歴なしランクを特定できません。有効なRFランクの旧コードNを確認してください。"
    end

    execute <<~SQL
      UPDATE rf_rule_sets
      SET no_visit_rank_id = #{connection.quote(rank_ids.first)}
      WHERE no_visit_rank_id IS NULL
    SQL
  end

  def down
    raise ActiveRecord::IrreversibleMigration,
          "補完後に設定された値と移行した値を区別できないため、自動削除しません。"
  end
end

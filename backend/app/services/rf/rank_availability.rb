module Rf
  module RankAvailability
    def self.used?(rank_ids)
      protected_ids = RfRuleSet.where(status: "published").pluck(:id)
      protected_ids += RfCalculationRun.where(status: %w[pending processing]).pluck(:rf_rule_set_id)
      protected_ids += RfCalculationRun.where(id: RfSetting.select(:current_calculation_run_id)).pluck(:rf_rule_set_id)
      rules = RfRuleSet.where(id: protected_ids.uniq)
      rules.where(no_visit_rank_id: rank_ids).exists? ||
        RfRankMapping.where(rf_rule_set_id: rules.select(:id), rf_rank_id: rank_ids).exists?
    end

    # 過去の未適用ルールを復元するときも、停止済みのランクを適用しない。
    def self.ensure_available!(rule_set)
      ids = (rule_set.rank_mappings.pluck(:rf_rank_id) + [ rule_set.no_visit_rank_id ]).compact.uniq
      return if StandardListMaster.active_rf_ranks.where(id: ids).count == ids.size

      rule_set.errors.add(:base, "使用するRFランクが無効です。基本コードの有効状態を確認してください")
      raise ActiveRecord::RecordInvalid, rule_set
    end
  end
end

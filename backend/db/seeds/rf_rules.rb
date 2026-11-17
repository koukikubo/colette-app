# frozen_string_literal: true

unless RfRuleSet.exists?
  ActiveRecord::Base.transaction do
    rf_rank_master =
      StandardMaster.find_or_create_by!(system_key: "rf_rank") do |master|
        master.name = "RFランク"
        master.description = "来店時期と来店回数から自動算出するランク"
        master.position = 7
        master.active = true
      end

    if rf_rank_master.standard_list_masters.exists?
      raise "既存のRFランクがあります。初期ルールを自動生成せず、管理画面でIDを選択してルールを作成してください。"
    end

    # キーは初期対応表を組み立てるためのテンプレート内の名称。
    # 永続化するランクの識別には、生成された主キーを使う。
    presets = {
      "A" => [ "Aランク", "#059669", "直近の来店があり、来店頻度が高い最優良顧客" ],
      "B" => [ "Bランク", "#0D9488", "比較的最近の来店があり、継続的に利用している常連顧客" ],
      "C" => [ "Cランク", "#2563EB", "一定の来店実績がある標準・育成対象の顧客" ],
      "D" => [ "Dランク", "#D97706", "一定期間来店がなく、再来店を促したい離反注意顧客" ],
      "E" => [ "Eランク", "#EA580C", "直近に初回または少数回来店した新規・低頻度顧客" ],
      "Z" => [ "Zランク", "#64748B", "長期間来店がない休眠顧客" ],
      "N" => [ "来店履歴なし", "#94A3B8", "集計期間内に完了した来店履歴がない顧客" ]
    }
    rf_ranks = {}
    presets.each_with_index do |(key, (label, color, description)), index|
      rf_ranks[key] = rf_rank_master.standard_list_masters.create!(
        label: label,
        description: description,
        display_color: color,
        initial_display_color: color,
        position: index + 1,
        active: true
      )
    end

    rule_set = RfRuleSet.create!(
      name: "初期RFルール",
      no_visit_rank: rf_ranks.fetch("N"),
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12,
      status: "published",
      published_at: Time.current
    )

    recency_rules = {}

    [
      [ "R1", "90日以内", 0, 90 ],
      [ "R2", "91日から180日", 91, 180 ],
      [ "R3", "181日から365日", 181, 365 ],
      [ "R4", "366日から729日", 366, 729 ],
      [ "R5", "730日以上", 730, nil ]
    ].each.with_index(1) do |values, position|
      code, label, min_days, max_days = values

      recency_rules[code] =
        rule_set.recency_rules.create!(
          code: code,
          label: label,
          min_days: min_days,
          max_days: max_days,
          position: position
        )
    end

    frequency_rules = {}

    [
      [ "F0", "0回", 0, 0 ],
      [ "F1", "1回", 1, 1 ],
      [ "F2", "2回", 2, 2 ],
      [ "F3", "3回から5回", 3, 5 ],
      [ "F4", "6回以上", 6, nil ]
    ].each.with_index(1) do |values, position|
      code, label, min_visits, max_visits = values

      frequency_rules[code] =
        rule_set.frequency_rules.create!(
          code: code,
          label: label,
          min_visits: min_visits,
          max_visits: max_visits,
          position: position
        )
    end

    rank_matrix = {
      "R1" => {
        "F0" => "N",
        "F1" => "E",
        "F2" => "C",
        "F3" => "B",
        "F4" => "A"
      },
      "R2" => {
        "F0" => "N",
        "F1" => "C",
        "F2" => "C",
        "F3" => "B",
        "F4" => "C"
      },
      "R3" => {
        "F0" => "N",
        "F1" => "C",
        "F2" => "C",
        "F3" => "C",
        "F4" => "C"
      },
      "R4" => {
        "F0" => "D",
        "F1" => "D",
        "F2" => "D",
        "F3" => "D",
        "F4" => "D"
      },
      "R5" => {
        "F0" => "Z",
        "F1" => "Z",
        "F2" => "Z",
        "F3" => "Z",
        "F4" => "Z"
      }
    }

    rank_matrix.each do |recency_code, frequency_mappings|
      frequency_mappings.each do |frequency_code, rank_key|
        rule_set.rank_mappings.create!(
          rf_recency_rule: recency_rules.fetch(recency_code),
          rf_frequency_rule: frequency_rules.fetch(frequency_code),
          rf_rank: rf_ranks.fetch(rank_key)
        )
      end
    end

    validation_result =
      Rf::RuleSetValidator.call(rule_set)

    unless validation_result.valid?
      messages =
        validation_result
          .errors
          .map { |error| error[:message] }

      raise <<~MESSAGE.squish
        初期RFルールが不正です:
        #{messages.join(" / ")}
      MESSAGE
    end
  end
end

puts "RF rule seed completed!"

# frozen_string_literal: true

unless RfRuleSet.exists?(version: 1)
  ActiveRecord::Base.transaction do
    rf_rank_master =
      StandardMaster.find_by!(
        system_key: "rf_rank"
      )

    rf_ranks =
      rf_rank_master
        .standard_list_masters
        .index_by(&:code)

    required_rank_codes = %w[A B C D E Z N]
    missing_rank_codes = required_rank_codes - rf_ranks.keys

    if missing_rank_codes.any?
      raise <<~MESSAGE.squish
        RFランクの基本コードが不足しています:
        #{missing_rank_codes.join(", ")}
      MESSAGE
    end

    rule_set = RfRuleSet.create!(
      name: "初期RFルール",
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
      frequency_mappings.each do |frequency_code, rank_code|
        rule_set.rank_mappings.create!(
          rf_recency_rule: recency_rules.fetch(recency_code),
          rf_frequency_rule: frequency_rules.fetch(frequency_code),
          rf_rank: rf_ranks.fetch(rank_code)
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

module Rf
  class CustomerRankCalculator
    # 顧客1人のRFランクを計算するサービス。
    # 呼び出し元へ返す計算結果の入れ物。
    Result = Struct.new(
      :rf_rank,
      :recency_days,
      :frequency_count,
      :last_visit_on,
      keyword_init: true
    )

    # 【入口】
    # 計算Jobや予定計算サービスから呼び出す。
    # 受け取った値をnewへ渡し、計算用オブジェクトのcallを実行する。
    def self.call(customer:, rule_set:, base_date:, visit_dates: nil)
      new(
        customer: customer,
        rule_set: rule_set,
        base_date: base_date,
        visit_dates: visit_dates
      ).call
    end

    # visit_dates省略：DBから取得する。
    def self.call_with_visit_dates(customer:, rule_set:, base_date:, visit_dates:)
      new(
        customer: customer,
        rule_set: rule_set,
        base_date: base_date,
        visit_dates: visit_dates

      ).call
    end

    # 【準備】
    # newによって自動的に呼ばれる。
    def initialize(customer:, rule_set:, base_date:, visit_dates: nil)
      @customer = customer
      @rule_set = rule_set
      @base_date = base_date.to_date
      @visit_dates = visit_dates
    end

    # 【計算】
    # 最終来店日と来店回数を求め、RFルールからランクを決定する。
    # どちらの取得方法でも、日付はlast_visit_onにそろえる。
    def call
      if @visit_dates.nil?
        # 通常計算：DBから最終来店日時と来店回数を取得する。
        last_visit_at = completed_visits.maximum(:starts_at)
        last_visit_on = last_visit_at&.in_time_zone&.to_date

        frequency_count =
            completed_visits.where(starts_at: frequency_period).count
      else
        # 予定計算：渡された来店日から、集計期間内のものを選ぶ。
        eligible_dates = @visit_dates.select do |date|
          date.between?(aggregation_started_on, base_date)
        end

        last_visit_on = eligible_dates.max

        frequency_count = eligible_dates.count do |date|
          date >= frequency_started_on
        end
      end

      # 両方の分岐で用意したlast_visit_onを確認する。
      return result_without_visit if last_visit_on.nil?

      recency_days = (base_date - last_visit_on).to_i

      recency_rule = find_recency_rule(recency_days)
      frequency_rule = find_frequency_rule(frequency_count)
      mapping = find_mapping(recency_rule, frequency_rule)
      # 判定結果を呼び出し元へ返す。
      Result.new(
        rf_rank: mapping.rf_rank,
        recency_days: recency_days,
        frequency_count: frequency_count,
        last_visit_on: last_visit_on
      )
    end

    private

    # initializeで保存した値を、各メソッドから参照できるようにする。
    attr_reader :customer, :rule_set, :base_date

    # 通常計算で使用する来店履歴。
    # 対象顧客の予約から、完了済み・未キャンセル・集計期間内を選ぶ。
    def completed_visits
      @completed_visits ||=
        customer
          .reservations
          .where.not(completed_at: nil)
          .where(canceled_at: nil)
          .where(starts_at: aggregation_period)
    end

    # DBから来店履歴を取得する期間。
    # 基準日の翌日0時は含めず、基準日当日の来店までを対象にする。
    def aggregation_period
      starts_at = aggregation_started_on.beginning_of_day
      ends_at = base_date.next_day.beginning_of_day

      starts_at...ends_at
    end

    # DBで来店回数を数える期間。
    # 回数集計開始日から、基準日当日の来店までを対象にする。
    def frequency_period
      starts_at = frequency_started_on.beginning_of_day
      ends_at = base_date.next_day.beginning_of_day

      starts_at...ends_at
    end

    # RFルールの全体集計月数から、来店履歴の集計開始日を求める。
    def aggregation_started_on
      base_date.advance(
        months: -rule_set.aggregation_months
      )
    end

    # RFルールの回数集計月数から、来店回数の集計開始日を求める。
    def frequency_started_on
      base_date.advance(
        months: -rule_set.frequency_window_months
      )
    end

    # 最終来店からの日数に当てはまるR条件を探す。
    # 条件がなければ、誤ったランクを返さずエラーにする。
    def find_recency_rule(recency_days)
      rule_set.recency_rules.detect do |rule|
        value_in_range?(
          recency_days,
          minimum: rule.min_days,
          maximum: rule.max_days
        )
      end || raise(
        ActiveRecord::RecordNotFound,
        "最終来店日からの期間に該当する条件がありません"
      )
    end

    # 来店回数に当てはまるF条件を探す。
    def find_frequency_rule(frequency_count)
      rule_set.frequency_rules.detect do |rule|
        value_in_range?(
          frequency_count,
          minimum: rule.min_visits,
          maximum: rule.max_visits
        )
      end || raise(
        ActiveRecord::RecordNotFound,
        "来店回数に該当する条件がありません"
      )
    end

    # R条件・F条件の範囲判定に共通で使用する。
    # 最小値・最大値は含め、最大値がnilなら上限なしとして扱う。
    def value_in_range?(value, minimum:, maximum:)
      value >= minimum &&
        (maximum.nil? || value <= maximum)
    end

    # 集計期間内の来店がない場合の計算結果を返す。
    def result_without_visit
      Result.new(
        rf_rank: no_visit_rank,
        recency_days: nil,
        frequency_count: 0,
        last_visit_on: nil
      )
    end

    # RFルールに設定されている「来店履歴なし」のランクを取得する。
    def no_visit_rank
      StandardListMaster.active_rf_ranks.find(rule_set.no_visit_rank_id)
    end

    # R条件とF条件に対応するランクを取得する。
    # 予定計算で関連を事前取得した場合は、メモリ上から検索する。
    # 通常計算の未取得時は、従来と同じDB検索を行う。
    def find_mapping(recency_rule, frequency_rule)
      unless rule_set.association(:rank_mappings).loaded?
        return rule_set.rank_mappings.find_by!(
          rf_recency_rule: recency_rule,
          rf_frequency_rule: frequency_rule
        )
      end

      rule_set.rank_mappings.detect do |mapping|
        mapping.rf_recency_rule_id == recency_rule.id &&
          mapping.rf_frequency_rule_id == frequency_rule.id
      end || raise(
        ActiveRecord::RecordNotFound,
        "R条件とF条件に対応するRFランクがありません"
      )
    end
  end
end

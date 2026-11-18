module Customers
  # 一覧の検索・選択肢・表示を、リクエスト開始時に選んだ同じ適用履歴へ固定する。
  # RF計算は行わず、ページ内の結果だけをまとめて読む。
  class CurrentRfQuery
    class IncompleteHistoryError < StandardError; end

    STATES = %w[no_applied_run not_calculated excluded no_visit unmatched ranked].freeze

    def initialize
      @run = RfSetting.includes(current_calculation_run: :rf_rule_set).first&.current_calculation_run
      @run = nil unless @run&.status == "completed"
      @results = {}
    end

    # 検索条件をページ分割前のRelationへ適用し、総件数と結果行を一致させる。
    def filter(customers, rank_id:, state:)
      if rank_id.present? && state.present?
        raise ActionController::BadRequest, "RFランクとRF分類はどちらか一方を指定してください"
      end
      if state.present? && !STATES.include?(state)
        raise ActionController::BadRequest, "RF分類が不正です"
      end
      if rank_id.present?
        id = Integer(rank_id.to_s, 10, exception: false)
        unless id&.positive? && ranks.key?(id)
          raise ActionController::BadRequest, "現在適用中のRFランクを指定してください"
        end
        return customers.where(id: results.where(rf_rank_id: id, exclusion_reason: nil).select(:customer_id))
      end
      return customers if state.blank?
      return state == "no_applied_run" ? customers : customers.none unless @run
      return customers.none if state == "no_applied_run"
      return customers.where.not(id: results.select(:customer_id)) if state == "not_calculated"

      selected = case state
      when "excluded" then results.where(exclusion_reason: "manual_customer_rank")
      when "unmatched" then results.where(exclusion_reason: "no_matching_rule")
      when "no_visit" then results.where(rf_rank_id: @run.rf_rule_set.no_visit_rank_id, exclusion_reason: nil)
      when "ranked"
        results.where(exclusion_reason: nil).where.not(rf_rank_id: nil).where.not(rf_rank_id: @run.rf_rule_set.no_visit_rank_id)
      end
      customers.where(id: selected.select(:customer_id))
    end

    # 関連を1人ずつ引かず、ページ内の顧客結果だけを一括取得する。
    def load_page(customers)
      @results = @run ? results.where(customer_id: customers.map(&:id)).index_by(&:customer_id) : {}
    end

    # 一覧の追加項目だけを返し、作成・更新レスポンスの既存契約は変更しない。
    def fields(customer_id)
      result = @results[customer_id]
      {
        current_rf_rank: result&.rf_rank_id ? rank_for(result.rf_rank_id).slice(:id, :display_code, :label, :display_color) : nil,
        rf_rank_state: state_for(result),
        rf_rank_basis: result ? {
          calculation_run_id: @run.id, base_date: @run.base_date,
          recency_days: result.recency_days, frequency_count: result.frequency_count,
          last_visit_on: result.last_visit_on, exclusion_reason: result.exclusion_reason
        } : nil
      }
    end

    # 選択肢も同じ履歴の名称・色を返し、現在のマスタとの混在を防ぐ。
    def reference
      { calculation_run_id: @run&.id, base_date: @run&.base_date, ranks: ranks.values }
    end

    private

    def rank_for(id)
      ranks.fetch(id) { raise IncompleteHistoryError, "適用中のRF履歴にランク情報がありません" }
    end

    def results
      @run.customer_rf_rank_results
    end

    # 除外理由を先に判定し、未訪問ランクのIDと通常ランクを区別する。
    def state_for(result)
      return "no_applied_run" unless @run
      return "not_calculated" unless result
      return "excluded" if result.exclusion_reason == "manual_customer_rank"
      return "unmatched" if result.exclusion_reason == "no_matching_rule"
      return "no_visit" if result.rf_rank_id == @run.rf_rule_set.no_visit_rank_id

      "ranked"
    end

    def ranks
      @ranks ||= begin
        # スナップショット以前の履歴だけ、既存のルール・結果に紐づくマスタへフォールバックする。
        snapshots = if @run.nil?
          []
        elsif @run.rf_rank_snapshots
          @run.rf_rank_snapshots
        else
          ids = (results.distinct.pluck(:rf_rank_id) + @run.rf_rule_set.rank_mappings.pluck(:rf_rank_id) + [ @run.rf_rule_set.no_visit_rank_id ]).compact.uniq
          StandardListMaster.where(id: ids).ordered.map do |rank|
            { "id" => rank.id, "display_code" => rank.display_code, "label" => rank.label, "display_color" => rank.display_color }
          end
        end
        snapshots.to_h do |rank|
          [ rank.fetch("id"), { id: rank.fetch("id"), display_code: rank.fetch("display_code"), label: rank.fetch("label"), display_color: rank.fetch("display_color") } ]
        end
      end
    rescue KeyError
      raise IncompleteHistoryError, "適用中のRF履歴のランク情報が不完全です"
    end
  end
end

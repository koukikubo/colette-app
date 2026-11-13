module Rf
  # 集計で使った履歴を固定し、内訳の絞り込みとページ分割をDBで行う。
  # 条件式はArelで構成し、入力値やスナップショットをSQL文字列へ連結しない。
  class CustomerListQuery
    attr_reader :run, :previous, :ranks, :previous_ranks

    def initialize(run:, previous: nil)
      @run = run
      @previous = previous
      @ranks = RunPopulationRowBuilder.call(calculation_run: run).fetch(:ranks).index_by { |rank| rank.fetch(:id) }
      @previous_ranks = previous ? RunPopulationRowBuilder.call(calculation_run: previous).fetch(:ranks).index_by { |rank| rank.fetch(:id) } : {}
      @customers = Customer.arel_table
      @current = CustomerRfRankResult.arel_table.alias("current_result")
      @prior = CustomerRfRankResult.arel_table.alias("prior_result")
    end

    def call(filters)
      relation = Customer.joins(result_join(@current, run))
      if previous
        category = category_expression
        relation = relation.joins(result_join(@prior, previous)).where(@current[:id].not_eq(nil).or(@prior[:id].not_eq(nil)))
        relation = relation.where(category.eq(filters[:category])) if filters[:category].present?
        { "from" => [ @prior, previous ], "to" => [ @current, run ] }.each do |side, (table, source)|
          relation = relation.where(state_expression(table, source).eq(filters["#{side}_state"])) if filters["#{side}_state"].present?
          relation = relation.where(table[:rf_rank_id].eq(positive_id(filters["#{side}_rank_id"]))) if filters["#{side}_rank_id"].present?
        end
        relation = relation.select(@customers[Arel.star], category.as("movement_category"),
          state_expression(@prior, previous).as("from_state"), state_expression(@current, run).as("to_state"), @prior[:rf_rank_id].as("from_rank_id"))
      else
        relation = relation.where(@current[:id].not_eq(nil).and(@current[:exclusion_reason].eq(nil)).and(@current[:rf_rank_id].not_eq(nil)))
        relation = relation.where(@current[:rf_rank_id].eq(positive_id(filters[:rf_rank_id]))) if filters[:rf_rank_id].present?
        if filters[:recency_rule_id].present? || filters[:frequency_rule_id].present?
          recency = run.rf_rule_set.recency_rules.find(positive_id(filters[:recency_rule_id]))
          frequency = run.rf_rule_set.frequency_rules.find(positive_id(filters[:frequency_rule_id]))
          relation = relation.where(@current[:recency_days].gteq(recency.min_days).and(@current[:frequency_count].gteq(frequency.min_visits)))
          relation = relation.where(@current[:recency_days].lteq(recency.max_days)) if recency.max_days
          relation = relation.where(@current[:frequency_count].lteq(frequency.max_visits)) if frequency.max_visits
        end
        relation = relation.select(@customers[Arel.star], state_expression(@current, run).as("to_state"))
      end
      relation.select(@current[:rf_rank_id].as("to_rank_id"), @current[:last_visit_on].as("result_last_visit_on"),
        @current[:frequency_count].as("result_frequency_count"), @current[:recency_days].as("result_recency_days")).order(@customers[:id].asc)
    end

    def serialize(customer)
      { customer_id: customer.id, customer_name: customer.customer_kind == "corporate" ? customer.company_name.presence || customer.name : customer.name,
        from_rank: previous ? previous_ranks[customer[:from_rank_id]] : nil, to_rank: ranks[customer[:to_rank_id]],
        category: previous ? customer[:movement_category] : nil, from_state: previous ? customer[:from_state] : nil, to_state: customer[:to_state],
        last_visit_on: customer[:result_last_visit_on], frequency_count: customer[:result_frequency_count], recency_days: customer[:result_recency_days] }
    end

    private

    def positive_id(value)
      id = Integer(value.to_s, 10, exception: false)
      raise ActionController::BadRequest, "条件IDは1以上の整数で指定してください" unless id&.positive?
      id
    end

    def result_join(table, source)
      @customers.join(table, Arel::Nodes::OuterJoin).on(table[:customer_id].eq(@customers[:id]).and(table[:rf_calculation_run_id].eq(source.id))).join_sources
    end

    def unmatched(table)
      table[:exclusion_reason].eq("no_matching_rule").or(table[:rf_rank_id].eq(nil))
    end

    def state_expression(table, source)
      Arel::Nodes::Case.new.when(table[:id].eq(nil)).then("missing")
        .when(table[:exclusion_reason].eq("manual_customer_rank")).then("excluded")
        .when(unmatched(table)).then("unmatched")
        .when(table[:rf_rank_id].eq(source.rf_rule_set.no_visit_rank_id)).then("no_visit").else("ranked")
    end

    def position_expression(table, snapshots)
      return Arel::Nodes.build_quoted(nil) if snapshots.empty?
      snapshots.reduce(Arel::Nodes::Case.new(table[:rf_rank_id])) do |expression, (id, rank)|
        expression.when(id).then(rank.fetch(:position))
      end.else(nil)
    end

    # 集計の分類順（追加/消失→除外→未分類→未訪問→順位）と揃える。
    def category_expression
      current_position = position_expression(@current, ranks)
      prior_position = position_expression(@prior, previous_ranks)
      Arel::Nodes::Case.new.when(@prior[:id].eq(nil)).then("added").when(@current[:id].eq(nil)).then("removed")
        .when(@prior[:exclusion_reason].eq("manual_customer_rank").or(@current[:exclusion_reason].eq("manual_customer_rank"))).then("excluded")
        .when(unmatched(@prior).or(unmatched(@current))).then("unmatched")
        .when(@prior[:rf_rank_id].eq(previous.rf_rule_set.no_visit_rank_id).or(@current[:rf_rank_id].eq(run.rf_rule_set.no_visit_rank_id))).then("no_visit")
        .when(@prior[:rf_rank_id].eq(@current[:rf_rank_id])).then("unchanged")
        .when(current_position.lt(prior_position)).then("up").when(current_position.gt(prior_position)).then("down").else("same_position")
    end
  end
end

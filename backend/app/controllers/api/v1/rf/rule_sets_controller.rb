class Api::V1::Rf::RuleSetsController <
  Api::V1::BaseController
  include ApiPagination

  def index
    pagination = pagination_params
    return unless pagination

    paginated_rule_sets =
      paginate(
        RfRuleSet
          .includes(
            created_by_staff: :staff_master
          )
          .order(version: :desc),
        **pagination
      )

    render_success(
      data: {
        rule_sets:
          paginated_rule_sets[:records].map do |rule_set|
            Api::V1::Rf::RuleSetSummarySerializer
              .new(rule_set)
              .as_json
          end,
        pagination: paginated_rule_sets[:metadata]
      }
    )
  end

  def show
    rule_set =
      RfRuleSet
        .includes(
          :recency_rules,
          :frequency_rules,
          rank_mappings: :rf_rank
        )
        .find(params[:id])

    render_success(
      data: {
        rule_set:
          Api::V1::Rf::RuleSetSerializer
            .new(rule_set)
            .as_json
      }
    )
  end
end

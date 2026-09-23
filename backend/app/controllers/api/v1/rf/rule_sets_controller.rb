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

  def create
    rule_set =
      Rf::RuleSetCreator.call(
        attributes: rule_set_params.to_h,
        created_by_staff: current_staff
      )

    render_success(
      data: {
        rule_set:
          Api::V1::Rf::RuleSetSerializer
            .new(rule_set)
            .as_json
      },
      status: :created
    )
  end

  def update
    rule_set =
      Rf::RuleSetUpdater.call(
        rule_set: RfRuleSet.find(params[:id]),
        attributes: rule_set_params.to_h
      )

    render_success(
      data: {
        rule_set:
          Api::V1::Rf::RuleSetSerializer
            .new(rule_set)
            .as_json
      }
    )
  end

  def validate
    rule_set =
      RfRuleSet
        .includes(
          :recency_rules,
          :frequency_rules,
          rank_mappings: {
            rf_rank: :standard_master
          }
        )
        .find(params[:id])

    result = Rf::RuleSetValidator.call(rule_set)

    render_success(
      data: {
        validation: {
          valid: result.valid?,
          errors: result.errors,
          warnings: result.warnings
        }
      }
    )
  end

  def publish
    rule_set =
      Rf::RuleSetPublisher.call(
        rule_set: RfRuleSet.find(params[:id]),
        expected_lock_version:
          publish_params[:lock_version]
      )

    render_success(
      data: {
        rule_set:
          Api::V1::Rf::RuleSetSerializer
            .new(rule_set)
            .as_json
      }
    )
  end

  private

  def rule_set_params
    params.expect(
      rf_rule_set: [
        :name,
        :aggregation_months,
        :frequency_window_months,
        :lock_version,
        {
          recency_rules: [
            %i[
            code
            label
            min_days
            max_days
            position
            ]
          ],
          frequency_rules: [
            %i[
            code
            label
            min_visits
            max_visits
            position
            ]
          ],
          rank_mappings: [
            %i[
            recency_code
            frequency_code
            rf_rank_id
            ]
          ]
        }
      ]
    )
  end

  def publish_params
    params.expect(
      rf_rule_set: [
        :lock_version
      ]
    )
  end
end

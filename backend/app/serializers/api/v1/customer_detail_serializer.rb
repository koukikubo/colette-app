module Api
  module V1
    class CustomerDetailSerializer < CustomerSerializer
      def initialize(
        resource,
        current_rf_rank_result:
      )
        super(resource)

        @current_rf_rank_result =
          current_rf_rank_result
      end

      def as_json
        super.merge(
          current_rf_rank:
            serialize_current_rf_rank,
          rf_rank_basis:
            serialize_rf_rank_basis
        )
      end

      private

      attr_reader :current_rf_rank_result

      def serialize_current_rf_rank
        rf_rank =
          current_rf_rank_result&.rf_rank

        return nil if rf_rank.nil?

        {
          id: rf_rank.id,
          code: rf_rank.code,
          label: rf_rank.label
        }
      end

      def serialize_rf_rank_basis
        return nil if current_rf_rank_result.nil?

        {
          calculation_run_id:
            current_rf_rank_result
              .rf_calculation_run_id,
          base_date:
            current_rf_rank_result
              .rf_calculation_run
              .base_date,
          recency_days:
            current_rf_rank_result.recency_days,
          frequency_count:
            current_rf_rank_result.frequency_count,
          last_visit_on:
            current_rf_rank_result.last_visit_on,
          exclusion_reason:
            current_rf_rank_result.exclusion_reason
        }
      end
    end
  end
end

module Api
  module V1
    class CustomerDetailSerializer < CustomerSerializer
      def initialize(resource, rf_fields:)
        super(resource)
        @rf_fields = rf_fields
      end

      # RF情報は一覧と共通の取得処理で確定済み。ここではマスタを再参照しない。
      def as_json
        super.merge(@rf_fields)
      end
    end
  end
end

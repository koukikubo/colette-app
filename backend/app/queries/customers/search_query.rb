module Customers
  class SearchQuery
    TEXT_SEARCH_CONDITION = <<~SQL.squish.freeze
      customers.name ILIKE :keyword
      OR customers.kana ILIKE :keyword
      OR customers.email ILIKE :keyword
      OR customers.company_name ILIKE :keyword
      OR customers.company_name_kana ILIKE :keyword
      OR customers.company_email ILIKE :keyword
    SQL

    PHONE_SEARCH_CONDITION = <<~SQL.squish.freeze
      customers.phone_number LIKE :phone_keyword
      OR customers.company_phone_number LIKE :phone_keyword
    SQL

    def initialize(relation: Customer.all, keyword:)
      @relation = relation
      @keyword = keyword.to_s.strip
    end

    def call
      return relation if keyword.blank?

      relation.where(search_condition, bind_values)
    end

    private

    attr_reader :relation, :keyword

    def search_condition
      return TEXT_SEARCH_CONDITION if phone_keyword.blank?

      <<~SQL.squish
        (#{TEXT_SEARCH_CONDITION})
        OR (#{PHONE_SEARCH_CONDITION})
      SQL
    end

    def bind_values
      values = {
        keyword: "%#{escaped_keyword}%"
      }

      if phone_keyword.present?
        values[:phone_keyword] = "%#{phone_keyword}%"
      end

      values
    end

    def escaped_keyword
      @escaped_keyword ||=
        ActiveRecord::Base.sanitize_sql_like(keyword)
    end

    def phone_keyword
      @phone_keyword ||= keyword.gsub(/\D/, "")
    end
  end
end
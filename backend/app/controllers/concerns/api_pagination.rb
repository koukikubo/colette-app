# frozen_string_literal: true

module ApiPagination
  extend ActiveSupport::Concern

  # APIで一度に取得できる件数を制限する。
  DEFAULT_PAGE = 1
  DEFAULT_PER_PAGE = 20
  MAX_PER_PAGE = 100

  private

  # page・per_pageを整数へ変換し、APIで使用できる値か検証する。
  def pagination_params
    page = pagination_integer(
      params[:page],
      default: DEFAULT_PAGE
    )

    per_page = pagination_integer(
      params[:per_page],
      default: DEFAULT_PER_PAGE
    )

    errors = []

    unless page&.positive?
      errors << "pageには1以上の整数を指定してください"
    end

    unless per_page&.positive?
      errors << "per_pageには1以上の整数を指定してください"
    end

    if per_page&.positive? && per_page > MAX_PER_PAGE
      errors << "per_pageには#{MAX_PER_PAGE}以下の整数を指定してください"
    end

    if errors.any?
      render_error(
        message: "ページ指定が不正です",
        errors: errors,
        status: :bad_request
      )

      return
    end

    {
      page: page,
      per_page: per_page
    }
  end

  # 絞り込み・並び替え済みのRelationへページ分割を適用する。
  def paginate(relation, page:, per_page:)
    total_count = relation.count
    total_pages = (total_count.to_f / per_page).ceil

    records =
      if total_pages.zero? || page > total_pages
        relation.none
      else
        relation
          .offset((page - 1) * per_page)
          .limit(per_page)
      end

    {
      records: records,
      metadata: {
        current_page: page,
        per_page: per_page,
        total_pages: total_pages,
        total_count: total_count
      }
    }
  end

  # 未指定なら初期値を返し、指定値は整数へ変換する。
  def pagination_integer(value, default:)
    return default if value.blank?

    Integer(value, exception: false)
  end
end

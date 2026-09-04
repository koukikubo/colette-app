// 一覧APIから返されるページ情報の共通形式。
export type Pagination = {
  current_page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
};

/*席種として返される基本コード情報*/
export type RestaurantTableType = {
  id: number;
  code: string;
  label: string;
};

/*作成・更新担当者として返される監査情報*/
export type RestaurantTableAuditStaff = {
  id: number;
  code: string | null;
  name: string | null;
};

/*席マスタ*/
export type RestaurantTable = {
  id: number;

  restaurant_table_type_id: number;
  restaurant_table_type: RestaurantTableType;

  sequence_number: number;
  code: string;
  name: string;
  capacity: number;
  active: boolean;
  position: number;
  memo: string | null;

  lock_version: number;

  created_by_staff: RestaurantTableAuditStaff | null;
  updated_by_staff: RestaurantTableAuditStaff | null;

  created_at: string;
  updated_at: string;
};

/*APIの成功レスポンス共通形式*/
export type ApiSuccessResponse<T> = {
  status: "success";
  data: T;
  message?: string;
};

/*席マスタ一覧取得レスポンス*/
export type RestaurantTablesResponse = ApiSuccessResponse<{
  restaurant_tables: RestaurantTable[];
}>;

/* 席マスタ詳細・登録・更新レスポンス*/
export type RestaurantTableResponse = ApiSuccessResponse<{
  restaurant_table: RestaurantTable;
}>;

/*席マスタ登録時に送信する属性code、sequence_number、作成担当者、更新担当者はRails側で生成するため送信しない。*/
export type CreateRestaurantTableAttributes = {
  restaurant_table_type_id: number;
  name: string;
  capacity: number;
  active: boolean;
  position: number;
  memo: string | null;
};

/*席マスタ登録リクエスト*/
export type CreateRestaurantTableRequest = {
  restaurant_table: CreateRestaurantTableAttributes;
};

/*席マスタ更新時に送信できる属性。席種、コード、連番、作成担当者は更新対象外。楽観的ロックのためlock_versionは必須。*/
export type UpdateRestaurantTableAttributes = {
  name?: string;
  capacity?: number;
  active?: boolean;
  position?: number;
  memo?: string | null;
  lock_version: number;
};

/*席マスタ更新リクエスト*/
export type UpdateRestaurantTableRequest = {
  restaurant_table: UpdateRestaurantTableAttributes;
};

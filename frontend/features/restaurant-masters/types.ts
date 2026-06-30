/*席種として返される基本コード情報*/
export type RestaurantMasterType = {
  id: number;
  code: string;
  label: string;
};

/*作成・更新担当者として返される監査情報*/
export type RestaurantMasterAuditStaff = {
  id: number;
  code: string | null;
  name: string | null;
};

/*席マスタ*/
export type RestaurantMaster = {
  id: number;

  restaurant_master_type_id: number;
  restaurant_master_type: RestaurantMasterType;

  sequence_number: number;
  code: string;
  name: string;
  capacity: number;
  active: boolean;
  memo: string | null;

  lock_version: number;

  created_by_staff: RestaurantMasterAuditStaff | null;
  updated_by_staff: RestaurantMasterAuditStaff | null;

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
export type RestaurantMastersResponse = ApiSuccessResponse<{
  restaurant_masters: RestaurantMaster[];
}>;

/* 席マスタ詳細・登録・更新レスポンス*/
export type RestaurantMasterResponse = ApiSuccessResponse<{
  restaurant_master: RestaurantMaster;
}>;

/*席マスタ登録時に送信する属性code、sequence_number、作成担当者、更新担当者はRails側で生成するため送信しない。*/
export type CreateRestaurantMasterAttributes = {
  restaurant_master_type_id: number;
  name: string;
  capacity: number;
  active: boolean;
  memo: string | null;
};

/*席マスタ登録リクエスト*/
export type CreateRestaurantMasterRequest = {
  restaurant_master: CreateRestaurantMasterAttributes;
};

/*席マスタ更新時に送信できる属性。席種、コード、連番、作成担当者は更新対象外。楽観的ロックのためlock_versionは必須。*/
export type UpdateRestaurantMasterAttributes = {
  name?: string;
  capacity?: number;
  active?: boolean;
  memo?: string | null;
  lock_version: number;
};

/*席マスタ更新リクエスト*/
export type UpdateRestaurantMasterRequest = {
  restaurant_master: UpdateRestaurantMasterAttributes;
};

// 更新用
export type PendingRestaurantMasterValues = {
  name: string;
  capacity: number;
  active: boolean;
  memo: string | null;
};

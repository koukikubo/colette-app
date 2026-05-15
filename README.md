# COLETTE

飲食店向け予約管理・顧客管理システムです。

紙の予約帳による運用課題を改善し、少数精鋭の店舗でも直感的に扱える予約管理・顧客管理システムを構築します。

## 技術構成

- Next.js
- Rails API
- PostgreSQL
- Docker
- shadcn/ui

## 開発目的

飲食店では、電話予約・手書き予約帳・スタッフ間共有など、日々の予約管理に多くの運用負荷があります。

紙の予約帳では、以下のような課題が発生しやすくなります。

- 水濡れや紛失による情報消失
- 他スタッフとの共有のしづらさ
- 予約変更履歴の追跡困難
- 顧客情報・接客履歴の蓄積不足
- 常連顧客への対応品質の属人化

COLETTE では、予約管理を中心に、顧客情報・接客履歴・店舗運用マスタを統合し、現場で直感的に使える業務システムを目指します。

## 主機能

- 自作認証
- 予約管理
- 顧客管理
- 担当者管理
- カレンダー UI
- 基本コードマスタ管理
- 接客メモ管理

## 設計方針

COLETTE は以下の思想で設計します。

```text
固定テーブル構造
+
基本コードマスタ駆動
+
動的 UI 生成
```

Entity 自体は固定構造を持ち、選択肢・状態・区分は基本コードマスタから取得します。

これにより、以下を実現します。

- SQL の複雑化防止
- index 最適化
- serializer 簡略化
- frontend 動的 UI 生成
- 運用変更への柔軟対応

## API レスポンス方針

API のレスポンス形式は、serializer を用いて標準化します。

### 目的

- オーバーフェッチの防止
- 不要カラムの隠蔽
- フロントエンドとの契約の安定化
- ドメインロジックと整形処理の分離

### ルール

- Controller は ActiveRecord オブジェクトを直接 `render` しない
- JSON レスポンスは serializer を経由して生成する
- API response shape は安定した状態を維持する

---

# テーブル設計

## テーブル一覧

| テーブル名              | 役割                                                   |
| :---------------------- | :----------------------------------------------------- |
| `staffs`                | 認証主体。ログイン情報を管理する                       |
| `staff_masters`         | 店舗運用主体。スタッフの氏名・権限・在籍情報を管理する |
| `customers`             | 顧客管理。CRM の中心                                   |
| `reservations`          | 来店イベント。予約情報の中心                           |
| `table_masters`         | 席マスタ                                               |
| `reservation_tables`    | 予約と席の中間テーブル                                 |
| `standard_masters`      | 基本コード親。区分カテゴリを管理する                   |
| `standard_list_masters` | 基本コード配下の選択肢を管理する                       |
| `customer_memos`        | 接客履歴                                               |

---

## 1. staffs

### 役割

認証主体です。

ログイン・セッション・認証情報のみを保持します。

### Association

```ruby
class Staff < ApplicationRecord
  belongs_to :staff_master

  has_many :reservations
end
```

### カラム一覧

| カラム名            | 型         | Optional | 意図                     |
| :------------------ | :--------- | :------- | :----------------------- |
| `id`                | bigint     | false    | PK                       |
| `staff_master_id`   | references | false    | 業務主体との紐付け       |
| `password_digest`   | string     | false    | `has_secure_password` 用 |
| `login_enabled`     | boolean    | false    | ログイン可否             |
| `failed_attempts`   | integer    | false    | ログイン失敗回数         |
| `last_logged_in_at` | datetime   | true     | 最終ログイン日時         |
| `created_at`        | datetime   | false    | 作成日時                 |
| `updated_at`        | datetime   | false    | 更新日時                 |

---

## 2. staff_masters

### 役割

店舗運用主体です。

「人」を管理する業務マスタです。

### Association

```ruby
class StaffMaster < ApplicationRecord
  has_one :staff, dependent: :destroy
  has_many :customer_memos
end
```

### カラム一覧

| カラム名                | 型       | Optional | 意図         |
| :---------------------- | :------- | :------- | :----------- |
| `id`                    | bigint   | false    | PK           |
| `code`                  | string   | false    | 担当者コード |
| `name`                  | string   | false    | 表示名       |
| `role_code`             | string   | false    | 権限コード   |
| `employment_started_at` | date     | true     | 在籍開始日   |
| `employment_ended_at`   | date     | true     | 退職日       |
| `note`                  | text     | true     | 備考         |
| `deleted_at`            | datetime | true     | 論理削除     |
| `created_at`            | datetime | false    | 作成日時     |
| `updated_at`            | datetime | false    | 更新日時     |

---

## 3. customers

### 役割

顧客管理主体です。

CRM の中心となるテーブルです。

### Association

```ruby
class Customer < ApplicationRecord
  has_many :reservations
  has_many :customer_memos
end
```

### カラム一覧

| カラム名               | 型       | Optional | 意図            |
| :--------------------- | :------- | :------- | :-------------- |
| `id`                   | bigint   | false    | PK              |
| `customer_code`        | string   | false    | 顧客コード      |
| `last_name`            | string   | false    | 姓              |
| `first_name`           | string   | false    | 名              |
| `last_name_kana`       | string   | true     | セイ            |
| `first_name_kana`      | string   | true     | メイ            |
| `phone_number`         | string   | false    | 電話番号検索    |
| `email`                | string   | true     | メール          |
| `birthday`             | date     | true     | 誕生日          |
| `gender_code`          | string   | true     | 性別コード      |
| `note`                 | text     | true     | 顧客備考        |
| `first_visited_at`     | date     | true     | 初回来店日      |
| `last_visited_at`      | date     | true     | 最終来店日      |
| `custom_field_01_code` | string   | true     | 自由設定項目 1  |
| `custom_field_02_code` | string   | true     | 自由設定項目 2  |
| `custom_field_03_code` | string   | true     | 自由設定項目 3  |
| `...`                  | string   | true     | 自由設定項目    |
| `custom_field_30_code` | string   | true     | 自由設定項目 30 |
| `deleted_at`           | datetime | true     | 論理削除        |
| `created_at`           | datetime | false    | 作成日時        |
| `updated_at`           | datetime | false    | 更新日時        |

---

## 4. reservations

### 役割

来店イベントです。

予約システムの中心となるテーブルです。

### Association

```ruby
class Reservation < ApplicationRecord
  belongs_to :customer
  belongs_to :staff

  has_many :reservation_tables
end
```

### カラム一覧

| カラム名                  | 型         | Optional | 意図           |
| :------------------------ | :--------- | :------- | :------------- |
| `id`                      | bigint     | false    | PK             |
| `customer_id`             | references | false    | 顧客           |
| `staff_id`                | references | false    | 登録担当       |
| `reservation_date`        | date       | false    | 来店日         |
| `reservation_time`        | time       | false    | 来店時間       |
| `guest_count`             | integer    | false    | 人数           |
| `reservation_status_code` | string     | false    | 予約状態       |
| `reservation_route_code`  | string     | true     | 予約経路       |
| `memo`                    | text       | true     | 備考           |
| `canceled_at`             | datetime   | true     | キャンセル日時 |
| `visited_at`              | datetime   | true     | 来店日時       |
| `created_at`              | datetime   | false    | 作成日時       |
| `updated_at`              | datetime   | false    | 更新日時       |

---

## 5. table_masters

### 役割

席マスタです。

店舗座席情報を管理します。

### Association

```ruby
class TableMaster < ApplicationRecord
  has_many :reservation_tables
end
```

### カラム一覧

| カラム名        | 型       | Optional | 意図           |
| :-------------- | :------- | :------- | :------------- |
| `id`            | bigint   | false    | PK             |
| `code`          | string   | false    | テーブルコード |
| `name`          | string   | false    | 表示名         |
| `seat_count`    | integer  | false    | 席数           |
| `area_code`     | string   | true     | エリアコード   |
| `active`        | boolean  | false    | 利用可否       |
| `display_order` | integer  | false    | 並び順         |
| `created_at`    | datetime | false    | 作成日時       |
| `updated_at`    | datetime | false    | 更新日時       |

---

## 6. reservation_tables

### 役割

予約と席の中間テーブルです。

### Association

```ruby
class ReservationTable < ApplicationRecord
  belongs_to :reservation
  belongs_to :table_master
end
```

### カラム一覧

| カラム名          | 型         | Optional | 意図     |
| :---------------- | :--------- | :------- | :------- |
| `id`              | bigint     | false    | PK       |
| `reservation_id`  | references | false    | 予約     |
| `table_master_id` | references | false    | 席       |
| `created_at`      | datetime   | false    | 作成日時 |
| `updated_at`      | datetime   | false    | 更新日時 |

---

## 7. standard_masters

### 役割

基本コードカテゴリ管理です。

システム全体の区分親を管理します。

### Association

```ruby
class StandardMaster < ApplicationRecord
  has_many :standard_list_masters
end
```

### カラム一覧

| カラム名        | 型       | Optional | 意図       |
| :-------------- | :------- | :------- | :--------- |
| `id`            | bigint   | false    | PK         |
| `code`          | string   | false    | 基本コード |
| `name`          | string   | false    | 名称       |
| `description`   | text     | true     | 説明       |
| `active`        | boolean  | false    | 利用可否   |
| `display_order` | integer  | false    | 並び順     |
| `created_at`    | datetime | false    | 作成日時   |
| `updated_at`    | datetime | false    | 更新日時   |

---

## 8. standard_list_masters

### 役割

基本コード配下の選択肢管理です。

Frontend の選択項目を動的生成します。

### Association

```ruby
class StandardListMaster < ApplicationRecord
  belongs_to :standard_master
end
```

### カラム一覧

| カラム名             | 型         | Optional | 意図         |
| :------------------- | :--------- | :------- | :----------- |
| `id`                 | bigint     | false    | PK           |
| `standard_master_id` | references | false    | 親コード     |
| `code`               | string     | false    | 選択肢コード |
| `label`              | string     | false    | 表示名       |
| `description`        | text       | true     | 説明         |
| `active`             | boolean    | false    | 利用可否     |
| `display_order`      | integer    | false    | 並び順       |
| `created_at`         | datetime   | false    | 作成日時     |
| `updated_at`         | datetime   | false    | 更新日時     |

### コード参照方針

`customers.gender_code` や `reservations.reservation_status_code` などの `*_code` は、`standard_list_masters.code` を論理参照します。

ただし、物理的な外部キー制約は持ちません。

---

## 9. customer_memos

### 役割

接客履歴です。

CRM 強化用のテーブルです。

### Association

```ruby
class CustomerMemo < ApplicationRecord
  belongs_to :customer
  belongs_to :staff_master
end
```

### カラム一覧

| カラム名          | 型         | Optional | 意図     |
| :---------------- | :--------- | :------- | :------- |
| `id`              | bigint     | false    | PK       |
| `customer_id`     | references | false    | 顧客     |
| `staff_master_id` | references | false    | 記録担当 |
| `content`         | text       | false    | 接客内容 |
| `created_at`      | datetime   | false    | 作成日時 |
| `updated_at`      | datetime   | false    | 更新日時 |

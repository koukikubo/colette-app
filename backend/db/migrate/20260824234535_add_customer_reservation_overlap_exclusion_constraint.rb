class AddCustomerReservationOverlapExclusionConstraint < ActiveRecord::Migration[8.1]
  def change
    # bigint型のcustomer_idをGiSTインデックスで比較できるようにする。
    enable_extension "btree_gist" unless extension_enabled?("btree_gist")

    # 同一顧客の有効な予約時間が重複しないことをDB側で保証する。
    add_exclusion_constraint(
      :reservations,
      "customer_id WITH =, tsrange(starts_at, ends_at, '[)') WITH &&",
      using: :gist,
      where: "customer_id IS NOT NULL AND canceled_at IS NULL",
      name: "exclude_active_customer_reservation_overlaps"
    )
  end
end

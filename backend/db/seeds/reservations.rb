puts "予約データを作成します"

seed_date = Date.current

staff = Staff.first!

restaurant_masters =
  RestaurantMaster
    .where(active: true)
    .order(:restaurant_master_type_id, :sequence_number)
    .limit(8)
    .to_a

if restaurant_masters.empty?
  raise "有効な席マスタがありません。先に席マスタのSEEDを実行してください。"
end

reservation_status =
  StandardListMaster
    .joins(:standard_master)
    .where(
      standard_masters: {
        system_key: "reservation_status"
      }
    )
    .first!

def reservation_seed_time(date, hour, minute)
  Time.zone.local(
    date.year,
    date.month,
    date.day,
    hour,
    minute
  )
end

reservation_seed_data = [
  {
    reservation_name: "山田 太郎",
    reservation_phone_number: "09011111111",
    starts_at: reservation_seed_time(seed_date, 17, 30),
    ends_at: reservation_seed_time(seed_date, 19, 0),
    guest_count: 4,
    restaurant_masters: [restaurant_masters[0]]
  },
  {
    reservation_name: "佐藤 花子",
    reservation_phone_number: "09022222222",
    starts_at: reservation_seed_time(seed_date, 18, 0),
    ends_at: reservation_seed_time(seed_date, 19, 30),
    guest_count: 2,
    restaurant_masters: [restaurant_masters[1]]
  },
  {
    reservation_name: "鈴木 一郎",
    reservation_phone_number: "09033333333",
    starts_at: reservation_seed_time(seed_date, 18, 45),
    ends_at: reservation_seed_time(seed_date, 20, 15),
    guest_count: 3,
    restaurant_masters: [restaurant_masters[2]]
  },
  {
    reservation_name: "高橋 美咲",
    reservation_phone_number: "09044444444",
    starts_at: reservation_seed_time(seed_date, 19, 0),
    ends_at: reservation_seed_time(seed_date, 21, 0),
    guest_count: 2,
    restaurant_masters: [restaurant_masters[3]]
  },
  {
    reservation_name: "田中 商事",
    reservation_phone_number: "0611112222",
    starts_at: reservation_seed_time(seed_date, 19, 30),
    ends_at: reservation_seed_time(seed_date, 22, 0),
    guest_count: 6,
    restaurant_masters: [
      restaurant_masters[4],
      restaurant_masters[5]
    ].compact
  },
  {
    reservation_name: "伊藤 健",
    reservation_phone_number: "09055555555",
    starts_at: reservation_seed_time(seed_date, 20, 15),
    ends_at: reservation_seed_time(seed_date, 21, 45),
    guest_count: 2,
    restaurant_masters: [restaurant_masters[6]].compact
  },
  {
    reservation_name: "渡辺 家",
    reservation_phone_number: "09066666666",
    starts_at: reservation_seed_time(seed_date, 21, 0),
    ends_at: reservation_seed_time(seed_date, 23, 0),
    guest_count: 4,
    restaurant_masters: [restaurant_masters[7]].compact
  },
  {
    reservation_name: "小林 グループ",
    reservation_phone_number: "09077777777",
    starts_at: reservation_seed_time(seed_date, 18, 30),
    ends_at: reservation_seed_time(seed_date, 20, 30),
    guest_count: 5,

    # 空配列にすると席未割当になります
    restaurant_masters: []
  }
]

reservation_seed_data.each do |seed|
  assigned_restaurant_masters = seed.delete(:restaurant_masters)

  requested_restaurant_master =
    assigned_restaurant_masters.first || restaurant_masters.first

  reservation =
    Reservation.find_or_initialize_by(
      reservation_name: seed[:reservation_name],
      starts_at: seed[:starts_at]
    )

  reservation.assign_attributes(
    seed.merge(
      requested_restaurant_master_type_id:
        requested_restaurant_master.restaurant_master_type_id,
      reservation_status_id: reservation_status.id,
      created_by_staff_id: staff.id,
      updated_by_staff_id: staff.id
    )
  )

  reservation.save!

  # 再度SEEDを実行した際に、古い席割当を残さない
  reservation.reservation_tables.destroy_all

  assigned_restaurant_masters.each do |restaurant_master|
    ReservationTable.create!(
      reservation: reservation,
      restaurant_master: restaurant_master
    )
  end
end

puts "#{reservation_seed_data.length}件の予約データを作成しました"
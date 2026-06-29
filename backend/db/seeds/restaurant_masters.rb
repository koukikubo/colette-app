
table_type_master_key = "restaurant_master_type"

seed_staff =
  Staff
    .joins(:staff_master)
    .where(login_enabled: true)
    .where(
      staff_masters: {
        role_code: "owner",
        retired_on: nil
      }
    )
    .order(:id)
    .first!

counter_type =
  StandardListMaster
    .joins(:standard_master)
    .where(
      standard_masters: {
        system_key: table_type_master_key,
        active: true
      }
    )
    .find_by!(
      code: "C",
      active: true
    )

table_type =
  StandardListMaster
    .joins(:standard_master)
    .where(
      standard_masters: {
        system_key: table_type_master_key,
        active: true
      }
    )
    .find_by!(
      code: "T",
      active: true
    )

counter_seats =
  (1..16).map do |number|
    {
      restaurant_master_type: counter_type,
      name: "カウンター#{number}",
      capacity: 1,
      active: true,
      position: number,
      memo: nil
    }
  end

table_seats = [
  {
    restaurant_master_type: table_type,
    name: "菊",
    capacity: 4,
    active: true,
    position: 17,
    memo: nil
  },
  {
    restaurant_master_type: table_type,
    name: "梅",
    capacity: 4,
    active: true,
    position: 18,
    memo: nil
  },
  {
    restaurant_master_type: table_type,
    name: "A",
    capacity: 4,
    active: true,
    position: 19,
    memo: nil
  },
  {
    restaurant_master_type: table_type,
    name: "B",
    capacity: 2,
    active: true,
    position: 20,
    memo: nil
  },
  {
    restaurant_master_type: table_type,
    name: "C",
    capacity: 4,
    active: true,
    position: 21,
    memo: nil
  },
  {
    restaurant_master_type: table_type,
    name: "D",
    capacity: 2,
    active: true,
    position: 22,
    memo: nil
  },
  {
    restaurant_master_type: table_type,
    name: "竹",
    capacity: 4,
    active: true,
    position: 23,
    memo: nil
  },
  {
    restaurant_master_type: table_type,
    name: "松",
    capacity: 6,
    active: true,
    position: 24,
    memo: nil
  }
]

ActiveRecord::Base.transaction do
  (counter_seats + table_seats).each do |seat|
    table_type = seat.fetch(:restaurant_master_type)
    name = seat.fetch(:name)

    next if RestaurantMaster.exists?(
      restaurant_master_type: table_type,
      name: name
    )

    RestaurantMasters::CreateService.call(
      attributes: {
        restaurant_master_type_id: table_type.id,
        name: name,
        capacity: seat.fetch(:capacity),
        active: seat.fetch(:active),
        position: seat.fetch(:position),
        memo: seat.fetch(:memo)
      },
      current_staff: seed_staff
    )
  end
end

puts "席マスタSeedを登録しました。"
puts "登録件数: #{RestaurantMaster.count}件"
puts "総席数: #{RestaurantMaster.sum(:capacity)}席"
require "rails_helper"

RSpec.describe "実席コードの並行採番", type: :model do
  include_context "independent integrity connections"

  around do |example|
    example.run
  ensure
    # この例が作成した実席だけを、参照先マスタより先に片付ける。
    RestaurantMaster.where(name: @marker).delete_all
  end

  it "同時にテーブル席を登録してもT01とT02を一度ずつ作成する" do
    staff = tracked(:staff, staff_master: tracked(:staff_master))
    master = tracked(:standard_master, system_key: "restaurant_master_type")
    type = tracked(:standard_list_master, standard_master: master, code: "T")
    codes = concurrently do |_index|
      RestaurantMasters::CreateService.call(attributes: {
        restaurant_master_type_id: type.id, name: @marker, capacity: 4, active: true, position: 1
      }, current_staff: staff).code
    end
    expect(codes.sort).to eq(%w[T01 T02])
    expect(RestaurantMaster.where(name: @marker).count).to eq(2)
  end
end

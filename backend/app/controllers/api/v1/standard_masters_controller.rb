class Api::V1::StandardMastersController < Api::V1::BaseController
  def index
    keyword = params[:query].presence || params[:q].presence
    standard_masters =
      StandardMaster
      .search(query: keyword, active: params[:active])
      .includes(:usage_place, :standard_list_masters)
      .ordered

    render_success(
      data: {
        usage_places: StandardCodeUsagePlace.ordered.map { |place| place.slice(:id, :key, :name, :description) },
        standard_masters: standard_masters.map do |standard_master|
          Api::V1::StandardMasterSerializer.new(standard_master).as_json
        end
      }
    )
  end

  def show
    standard_master =
      StandardMaster
      .includes(:usage_place, :standard_list_masters)
      .find(params[:id])

    render_success(
      data: {
        standard_master: Api::V1::StandardMasterSerializer.new(standard_master).as_json
      }
    )
  end

  def create
    standard_master = StandardMaster.new(standard_master_params)

    # 件数上限と採番を同じロック内で確認し、同時追加でも重複させない。
    StandardMaster.transaction do
      StandardCodes::ConfigurationLock.acquire!
      standard_master.position = StandardMaster.maximum(:position).to_i + 1
      standard_master.save!
    end

    render_success(
      data: {
        standard_master:
          Api::V1::StandardMasterSerializer.new(standard_master).as_json
      },
      status: :created
    )
  end

  def update
    standard_master = StandardMaster.find_by!(id: params[:id])

    standard_master.update!(standard_master_params)

    render_success(
      data: {
        standard_master:
          Api::V1::StandardMasterSerializer.new(standard_master).as_json
      }
    )
  end

  private

  def standard_master_params
    attributes = params.expect(
      standard_master: %i[
        name
        description
        active
        usage_place_id
        input_type
        input_group
        customer_detail_mode
        customer_detail_group
      ]
    )
    if (attributes.keys & %w[usage_place_id input_type input_group]).any? &&
        (attributes.keys & %w[customer_detail_mode customer_detail_group]).any?
      raise ActionController::BadRequest, "新旧の項目設定を同時に指定できません"
    end
    attributes
  end
end

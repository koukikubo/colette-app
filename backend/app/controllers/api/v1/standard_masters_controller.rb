class Api::V1::StandardMastersController < Api::V1::BaseController
  def index
    keyword = params[:query].presence || params[:q].presence
    standard_masters =
      StandardMaster
      .search(query: keyword, active: params[:active])
      .includes(:standard_list_masters)
      .ordered

    render_success(
      data: {
        standard_masters: standard_masters.map do |standard_master|
          Api::V1::StandardMasterSerializer.new(standard_master).as_json
        end
      }
    )
  end

  def show
    standard_master =
      StandardMaster
      .includes(:standard_list_masters)
      .find_by!(params[:id])

    render_success(
      data: {
        standard_master: Api::V1::StandardMasterSerializer.new(standard_master).as_json
      }
    )
  end

  def create
    standard_master = StandardMaster.new(standard_master_params)

    standard_master.position =
      StandardMaster.maximum(:position).to_i + 1

    standard_master.save!

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
    params.expect(
      standard_master: %i[
        name
        description
        active
      ]
    )
  end

end


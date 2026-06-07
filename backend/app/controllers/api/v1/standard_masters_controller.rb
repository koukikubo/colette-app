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
      .find_by!(code: params[:code])

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
    standard_master = StandardMaster.find_by!(code: params[:code])

    standard_master.update!(standard_master_params)

    render_success(
      data: {
        standard_master:
          Api::V1::StandardMasterSerializer.new(standard_master).as_json
      }
    )
  end

  def destroy
    standard_master = StandardMaster.find_by!(code: params[:code])

    standard_master.update!(active: false)

    render_success(
      data: {
        message: "標準マスタを無効化しました。",
        standard_master:
          Api::V1::StandardMasterSerializer.new(standard_master).as_json
      }
    )
  end

  private

  def standard_master_params
    permitted_params = params.expect(standard_master: %i[code name description active])
    permitted_params.require(:standard_master).permit(:code, :name, :description, :active)

    permitted_params
  end


end


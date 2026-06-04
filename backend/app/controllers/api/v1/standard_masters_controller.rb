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
end

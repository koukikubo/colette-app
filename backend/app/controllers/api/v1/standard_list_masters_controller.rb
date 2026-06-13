class Api::V1::StandardListMastersController < Api::V1::BaseController
  def index
    standard_master = StandardMaster.find_by!(code: params[:standard_master_code])
    render_success(
      data: standard_master.standard_list_masters.ordered.map do |item|
        Api::V1::StandardListMasterSerializer.new(item).as_json
      end
    )
  end
end

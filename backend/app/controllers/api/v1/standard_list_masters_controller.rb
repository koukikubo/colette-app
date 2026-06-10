class Api::V1::StandardListMastersController < Api::V1::BaseController
  before_action :set_standard_master

  def index
    render_success(
      data: {
        standard_list_masters: @standard_master.standard_list_masters.ordered.map do |item|
          Api::V1::StandardListMasterSerializer.new(item).as_json
        end
      }
    )
  end

  def show
    standard_list_master =
      @standard_master.standard_list_masters.find(params[:id])

    standard_list_master.update!(standard_list_master_params)

    render_success(
      data: {
        standard_list_master:
          Api::V1::StandardListMasterSerializer
            .new(standard_list_master)
            .as_json
      }
    )
  end


  def create
    standard_list_master =
      @standard_master.standard_list_masters.new(standard_list_master_params)

    standard_list_master.code = StandardListMaster.next_id_for(@standard_master)
    standard_list_master.position =
      @standard_master.standard_list_masters.maximum(:position).to_i + 1

    standard_list_master.save!

    render_success(
      data: {
        standard_list_master:
          Api::V1::StandardListMasterSerializer
            .new(standard_list_master)
            .as_json
      },
      status: :created
    )
  end

  def update
    standard_list_master = 
      @standard_master.standard_list_masters.find_by!(value: params[:id])

    standard_list_master.update!(standard_list_master_params)

    render_success(
      data: {
        standard_list_master:
          Api::V1::StandardListMasterSerializer
            .new(standard_list_master)
            .as_json
      }
    )
  end

  private

  def set_standard_master
    @standard_master =
      StandardMaster.find(params[:standard_master_id])
  end

  def standard_list_master_params
    params.expect(
      standard_list_master: %i[
        label
        description 
        active
      ]
      )
  end
end

class Api::V1::HealthController < Api::V1::BaseController
  def index
    render json: { status: "ok" }
  end
end

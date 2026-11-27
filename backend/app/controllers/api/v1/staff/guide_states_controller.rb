class Api::V1::Staff::GuideStatesController < Api::V1::BaseController
  def show
    render_state(current_staff.staff_guide_states.find_by(guide_version: StaffGuideState::CURRENT_VERSION))
  end

  def update
    input = params.expect(guide_state: %i[guide_version status])
    unless input[:guide_version].is_a?(Integer) && input[:guide_version] == StaffGuideState::CURRENT_VERSION && %w[completed skipped].include?(input[:status])
      raise ActionController::BadRequest, "案内の版と完了・スキップ状態を指定してください"
    end
    # 担当者IDは受け取らない。完了を別端末のスキップ操作で戻さない。
    state = StaffGuideState.record_outcome!(staff: current_staff, status: input[:status])
    render_state(state)
  end

  private

  def render_state(state)
    render_success(data: { guide_state: {
      guide_version: StaffGuideState::CURRENT_VERSION,
      status: state&.status || "unseen",
      updated_at: state&.updated_at&.iso8601
    } })
  end
end

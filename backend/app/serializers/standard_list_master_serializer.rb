class StandardListMasterSerializer < ApplicationSerializer

  def as_json
    {
      id: @resource.id,
      code: @resource.code,
      label: @resource.label,
      description: @resource.description,
      position: @resource.position,
      active: @resource.active
    }
  end
end
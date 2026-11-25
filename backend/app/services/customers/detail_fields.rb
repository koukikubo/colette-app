module Customers
  class DetailFields
    def initialize(customer)
      @customer = customer
    end

    # 有効な入力項目と、無効化後も保存されている既存回答を一括で取得する。
    def read
      Customer.transaction do
        StandardCodes::ConfigurationLock.acquire!
        @customer.reload
        selected_ids = CustomerDetailSelection.where(customer: @customer).pluck(:standard_list_master_id)
        answered_master_ids = StandardListMaster.where(id: selected_ids).select(:standard_master_id)
        masters = StandardMaster.where(usage_place: StandardCodeUsagePlace.find_by!(key: "customer_details"), active: true)
          .or(StandardMaster.where(id: answered_master_ids)).includes(:usage_place, :standard_list_masters).ordered
        fields = masters.map do |master|
          enabled = master.active? && master.customer_detail?
          items = master.standard_list_masters.sort_by { |item| [ item.position, item.id ] }
          { id: master.id, name: master.name, group: master.customer_detail_group,
            mode: master.customer_detail_mode, enabled: enabled,
            selected_ids: items.filter_map { |item| item.id if selected_ids.include?(item.id) },
            options: items.filter_map do |item|
              next unless item.active? || selected_ids.include?(item.id)
              { id: item.id, label: item.label, active: item.active? }
            end }
        end
        { customer_id: @customer.id, lock_version: @customer.lock_version, fields: fields }
      end
    end

    # 変更した項目だけを置換する。未送信・無効項目の回答は消さない。
    def update!(answers:, lock_version:, staff:)
      raise ActionController::BadRequest, "回答は配列で指定してください" unless answers.is_a?(Array) && answers.size <= StandardMaster::MAX_RECORDS
      Customer.transaction do
        StandardCodes::ConfigurationLock.acquire!
        @customer.lock!
        if @customer.lock_version != lock_version
          raise ActiveRecord::StaleObjectError.new(@customer, "update")
        end
        ids = answers.map { |answer| answer.fetch(:field_id) }
        invalid!("項目が重複しています") if ids.uniq.size != ids.size
        masters = StandardMaster.where(id: ids).includes(:usage_place, :standard_list_masters).index_by(&:id)
        selections = CustomerDetailSelection.where(customer: @customer)
        current_ids = selections.pluck(:standard_list_master_id)
        changes = answers.map do |answer|
          master = masters[answer.fetch(:field_id)]
          invalid!("使用できない顧客項目です") unless master && master.active? && master.customer_detail?
          choice_ids = answer.fetch(:option_ids)
          invalid!("選択肢は重複しない配列で指定してください") unless choice_ids.is_a?(Array) && choice_ids.uniq.size == choice_ids.size
          invalid!("この項目は1つだけ選択してください") if master.customer_detail_mode == "single" && choice_ids.size > 1
          choices = master.standard_list_masters.to_a
          invalid!("選択肢が別の項目に属するか、無効です") unless choice_ids.all? do |id|
            choices.any? { |item| item.id == id && (item.active? || current_ids.include?(id)) }
          end
          [ choices.map(&:id), choice_ids ]
        end
        changes.each do |all_ids, choice_ids|
          selections.where(standard_list_master_id: all_ids).where.not(standard_list_master_id: choice_ids).delete_all
          (choice_ids - current_ids).each do |id|
            CustomerDetailSelection.create!(customer: @customer, standard_list_master_id: id)
          end
        end
        @customer.update!(updated_by_staff: staff, updated_at: Time.current)
      end
    end

    private

    def invalid!(message)
      @customer.errors.add(:base, message)
      raise ActiveRecord::RecordInvalid, @customer
    end
  end
end

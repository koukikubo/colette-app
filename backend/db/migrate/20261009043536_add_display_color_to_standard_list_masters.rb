class AddDisplayColorToStandardListMasters < ActiveRecord::Migration[8.1]
  def change
    add_column :standard_list_masters,
                  :display_color,
                  :string,
                  limit: 7
    end
end

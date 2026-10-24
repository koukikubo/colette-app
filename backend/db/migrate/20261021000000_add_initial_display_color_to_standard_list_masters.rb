class AddInitialDisplayColorToStandardListMasters < ActiveRecord::Migration[8.1]
  def change
    add_column :standard_list_masters, :initial_display_color, :string
  end
end

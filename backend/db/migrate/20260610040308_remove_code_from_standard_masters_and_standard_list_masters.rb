class RemoveCodeFromStandardMastersAndStandardListMasters < ActiveRecord::Migration[8.1]
  def change
    remove_column :standard_masters, :code, :string
    remove_column :standard_list_masters, :code, :string
  end

end

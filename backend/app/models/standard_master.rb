class StandardMaster < ApplicationRecord
  has_many :standard_list_masters, dependent: :destroy

  
end

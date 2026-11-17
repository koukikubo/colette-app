module Rf
  class RankMovementClassifier
    def self.call(previous_rank:, current_rank:)
      if previous_rank.fetch(:id) == current_rank.fetch(:id)
        return :unchanged
      end

      previous_position = previous_rank.fetch(:position)
      current_position = current_rank.fetch(:position)

      if current_position < previous_position
        :up
      elsif current_position > previous_position
        :down
      else
        :same_position
      end
    end
  end
end

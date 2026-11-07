module Rf
  class AppliedRunHistory
    def self.call(current_run:)
      runs = []
      run = current_run

      while run
        runs << run
        run = run.previous_run
      end

      runs
    end
  end
end

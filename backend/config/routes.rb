Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      get "csrf", to: "csrf#show"

      namespace :staff do
        get "/login_options", to: "login_options#index"

        post "login", to: "sessions#create"
        delete "logout", to: "sessions#destroy"
        get "current", to: "sessions#current"
      end

      resources :staff_masters, only: %i[index show create update] do
        member do
          patch :retire
          patch :restore
          patch :login_enabled, action: :update_login_enabled
          patch :reset_failed_attempts
        end
      end

      resources :standard_masters, only: %i[index show create update] do
        collection do
          get :count
        end

        resources :standard_list_masters,
                  path: "items",
                  as: "items",
                  only: %i[index show create update]
      end

      resources :customers, only: %i[index show create update] do
        member do
          patch :hidden
          patch :restore
        end

        resources :reservations,
            only: :index,
            controller: "customer_reservations"
      end

      resources :restaurant_masters, only: %i[index show create update]
      # 予約席空き状況用
      resources :restaurant_master_availabilities,
                only: :index

      resources :reservations, only: %i[index show create update] do
        member do
          patch :cancel
          patch :reopen
          patch :restore
          patch :complete
        end
      end

      resource :rf_setting,
          path: "rf_settings",
          only: :show

      resources :rf_calculation_runs,
          only: :create do
        member do
          patch :activate
        end

        collection do
          patch :rollback
        end
      end
    end
  end
end

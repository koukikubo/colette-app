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
          controller: "rf/settings",
          only: :show

      resources :rf_calculation_runs,
          controller: "rf/calculation_runs",
          only: %i[index create show ] do
        member do
          patch :activate
          get :results
          patch :restore
        end

        collection do
          patch :rollback
        end
      end

      resources :rf_rule_sets,
        controller: "rf/rule_sets",
        only: %i[index show create update] do
        member do
          post :validate
          patch :publish
          patch :archive
        end
      end
    end
  end
end

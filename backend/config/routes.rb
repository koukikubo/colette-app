Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      get "health", to: "health#index"
      get "csrf", to: "csrf#show"

      namespace :staff do
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
      end

      resources :restaurant_masters, only: %i[index show create update] do
        
      end
    end
  end
end

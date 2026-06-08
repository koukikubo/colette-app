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

      resources :standard_masters, only: [:index, :show, :create, :update], param: :code do
        collection do
          get :next_code
          get :count
        end

        member do
          patch :disable
          patch :enable
        end

        resources :standard_list_masters,
                  path: "items",
                  as: "items",
                  only: [:index, :show, :create, :update] do
          member do
            patch :disable
            patch :enable
          end
        end
      end 
    end
  end
end

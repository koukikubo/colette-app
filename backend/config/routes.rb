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

      resources :standard_masters, only: [:index, :show, :create, :update] do
        collection do
          get :count
        end

        resources :standard_list_masters,
                  path: "items",
                  as: "items",
                  only: [:index, :show, :create, :update]
      end 
    end
  end
end

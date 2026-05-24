Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      get "health", to: "health#index"
      get "csrf", to: "csrf#show"

      resources :standard_masters, only: %i[index show], param: :code do
        collection do
          get :next_code
          get :count
        end

        resources :standard_list_masters,
          path: "items",
          as: "items",
          only: [:index, :show, :create, :update, :destroy]
      end 
    end
  end
end

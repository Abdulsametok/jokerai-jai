Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    get "health" => "health#show"
    post "health/job_check" => "health#create_job_check"
    get "health/job_check/:id" => "health#show_job_check"

    resource :session, only: %i[show create destroy]
    get "me" => "sessions#show"
    resources :users, only: %i[index create]

    resources :projects, only: %i[index show create update destroy] do
      resources :members, only: %i[create destroy]
      resources :sections, only: %i[create update]
      resources :tasks, only: :create
    end

    resources :tasks, only: %i[show update destroy] do
      post :move, on: :member
      resources :comments, only: :create
      post :agent_run, to: "agent_runs#create"
    end

    resources :goals, only: %i[index show create] do
      post :accept, on: :member
      post :replan, on: :member
    end

    resources :artifacts, only: [] do
      post :approve, on: :member
      post :reject, on: :member
    end

    get "ai/usage" => "ai_usage#show"

    get "my_tasks" => "my_tasks#index"

    resources :notifications, only: :index do
      post :read, on: :member
      post :read_all, on: :collection
    end

    namespace :admin do
      post "demo_reset" => "demo_resets#create"
    end
  end
end

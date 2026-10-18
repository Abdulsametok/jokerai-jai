Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    get "health" => "health#show"
    post "health/job_check" => "health#create_job_check"
    get "health/job_check/:id" => "health#show_job_check"
  end
end

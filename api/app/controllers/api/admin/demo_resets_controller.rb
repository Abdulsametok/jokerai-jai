module Api
  module Admin
    # Render free tier has no shell, so the demo data can be rebuilt over HTTP
    # with the ADMIN_TOKEN that only lives in Render's environment.
    class DemoResetsController < ApplicationController
      allow_unauthenticated_access

      def create
        return head :unauthorized unless admin_token_valid?

        render json: { status: "ok", result: DemoSeed.reset! }
      end
    end
  end
end

# Server-side session. Only a SHA-256 digest of the random token is stored;
# the raw token lives in an HttpOnly cookie that JavaScript cannot read.
class Session < ApplicationRecord
  TTL = 7.days

  belongs_to :user

  scope :active, -> { where("expires_at > ?", Time.current) }

  def self.digest(token)
    OpenSSL::Digest::SHA256.hexdigest(token)
  end

  def self.start!(user, request)
    token = SecureRandom.urlsafe_base64(32)
    session = create!(
      user: user,
      token_digest: digest(token),
      expires_at: TTL.from_now,
      last_seen_at: Time.current,
      user_agent: request.user_agent.to_s.first(255),
      ip_address: request.remote_ip
    )
    [ session, token ]
  end

  def self.find_by_token(token)
    return if token.blank?

    active.includes(:user).find_by(token_digest: digest(token))
  end

  def touch_last_seen!
    update_column(:last_seen_at, Time.current) if last_seen_at.nil? || last_seen_at < 5.minutes.ago
  end
end

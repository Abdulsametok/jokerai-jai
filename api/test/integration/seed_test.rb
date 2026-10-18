require "test_helper"

class SeedTest < ActiveSupport::TestCase
  test "seed is idempotent" do
    first = DemoSeed.run!
    second = DemoSeed.run!
    assert_equal first, second
    assert_equal 6, User.count
  end
end

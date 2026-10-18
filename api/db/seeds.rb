# Idempotent: safe to run repeatedly (bin/rails db:seed). For a clean slate use bin/rails demo:reset.
result = DemoSeed.run!
puts "Demo verisi hazır: #{result}"

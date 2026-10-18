namespace :demo do
  desc "Wipe application tables and recreate the synthetic demo data"
  task reset: :environment do
    result = DemoSeed.reset!
    puts "Demo verisi sıfırdan kuruldu: #{result}"
  end
end

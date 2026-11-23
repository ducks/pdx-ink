# frozen_string_literal: true

abort "Staging only" unless ENV["PDX_DEMO"] == "1" && (Rails.env.development? || Rails.env.test?)
mode = ENV.fetch("PDX_THEME", "ink")
raise "Use ink or foundation" unless %w[ink foundation].include?(mode)
theme = mode == "ink" ? Theme.find_by!(name: "PDX Ink") : Theme.find(Theme::CORE_THEMES.fetch("foundation"))
theme.set_default!
puts "Default theme: #{theme.name} (#{theme.id})"

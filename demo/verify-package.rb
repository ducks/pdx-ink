# frozen_string_literal: true
abort "Staging only" unless ENV["PDX_DEMO"] == "1" && Rails.env.development?
root = File.expand_path("..", __dir__)
{ "PDX Ink" => "pdx-ink-20260911.zip", "PDX Editorial" => "pdx-editorial-20260911.zip" }.each do |name, filename|
  theme = Theme.find_by!(name: name)
  imported = RemoteTheme.update_zipped_theme(File.join(root, "dist", filename), filename, theme_id: theme.id, update_components: "none")
  raise "Theme field errors: #{name}" if imported.theme_fields.any? { |field| field.error.present? }
  raise "Unsupported theme: #{name}" unless imported.supported?
  puts "ZIP import verified: #{filename} (#{imported.theme_fields.size} fields)"
end

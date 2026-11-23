# frozen_string_literal: true

abort "Demo installer requires PDX_DEMO=1 and development/test" unless ENV["PDX_DEMO"] == "1" && (Rails.env.development? || Rails.env.test?)
root = File.expand_path("..", __dir__)
theme = RemoteTheme.import_theme_from_directory(File.join(root, "theme"), theme_id: Theme.find_by(name: "PDX Ink")&.id)
editorial = RemoteTheme.import_theme_from_directory(File.join(root, "components/pdx-editorial"), theme_id: Theme.find_by(name: "PDX Editorial")&.id)
theme.add_relative_theme!(:child, editorial) unless theme.child_themes.exists?(editorial.id)
theme.update!(color_scheme_id: ColorScheme.find_by!(name: "PDX Flash").id, dark_color_scheme_id: ColorScheme.find_by!(name: "PDX After Hours").id, user_selectable: true)
SiteSetting.interface_color_selector = "header"
state = JSON.parse(File.read(File.join(__dir__, "state.json")))
editorial.update_setting(:features, [
  { "title" => "Find your kind of ink.", "path" => "/directory", "kicker" => "01 / THE TATTOOERS", "description" => "Meet the tattooers in the Portland directory. Explore their styles and the shops where they work." },
  { "title" => "Meet the neighborhood.", "path" => "/directory?kind=shops", "kicker" => "02 / THE SHOPS", "description" => "Find a studio and get to know the people behind the work." },
  { "title" => "Make yourself at home.", "path" => "/t/#{state['topics'][0]['id']}", "kicker" => "03 / THE COMMUNITY", "description" => "Introduce yourself and join the conversation. Start with the community's welcome thread." },
])
state["theme_id"] = theme.id
state["component_id"] = editorial.id
File.write(File.join(__dir__, "state.json"), JSON.pretty_generate(state))
puts "Installed PDX Ink #{theme.id} with PDX Editorial #{editorial.id}; default theme unchanged."

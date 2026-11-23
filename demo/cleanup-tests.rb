# frozen_string_literal: true
abort "Staging only" unless ENV["PDX_DEMO"] == "1" && Rails.env.development?
topic = Topic.find_by(title: "PDX Ink interaction verification (temporary)")
PostDestroyer.new(Discourse.system_user, topic.first_post, context: "PDX Ink staging test cleanup").destroy if topic
reader = User.find_by!(username: "pdx_reader")
Draft.where(user_id: reader.id).delete_all
puts "Removed temporary interaction topic and test-account drafts."

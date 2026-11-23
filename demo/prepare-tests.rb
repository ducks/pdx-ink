# frozen_string_literal: true
abort "Staging only" unless ENV["PDX_DEMO"] == "1" && Rails.env.development?
state_path = File.join(__dir__, "state.json")
state = JSON.parse(File.read(state_path))
title = "PDX Ink interaction verification (temporary)"
topic = Topic.find_by(title: title)
unless topic
  post = PostCreator.create!(Discourse.system_user, title: title, raw: "This temporary staging topic exercises native quoting, unread indicators, and composing. It is removed after the browser checks.", category: Category.find_by!(name: "General").id, skip_validations: true)
  topic = post.topic
  PostCreator.create!(Discourse.system_user, topic_id: topic.id, raw: "This reply supplies an unread state for the local test account. No production conversation is changed.", skip_validations: true)
end
reader = User.find_by!(username: "pdx_reader")
Draft.where(user_id: reader.id).delete_all
TopicUser.change(reader.id, topic.id, notification_level: TopicUser.notification_levels[:tracking], last_read_post_number: 1, highest_seen_post_number: 1, last_visited_at: 1.day.ago)
state["test_topic_id"] = topic.id
File.write(state_path, JSON.pretty_generate(state))
puts "Temporary interaction topic prepared: #{topic.id}"

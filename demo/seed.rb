# frozen_string_literal: true

abort "Production snapshot seed requires PDX_DEMO=1 and development/test" unless ENV["PDX_DEMO"] == "1" && (Rails.env.development? || Rails.env.test?)
abort "Install discourse-directory first" unless defined?(DiscourseDirectory::Entry)
require "securerandom"

snapshot = JSON.parse(File.read(File.join(__dir__, "production/snapshot.json")))
# Development's mail transport must remain local. No production SMTP configuration is imported.
smtp = ActionMailer::Base.smtp_settings
abort "Demo requires local mail transport" unless %w[localhost 127.0.0.1].include?(smtp[:address]) && smtp[:port].to_i == 1025
SiteSetting.disable_emails = "no"
SiteSetting.login_required = false
SiteSetting.invite_only = false
SiteSetting.allow_new_registrations = true
SiteSetting.must_approve_users = false
SiteSetting.site_description = ""
SiteSetting.navigation_menu = "sidebar"
SiteSetting.top_menu = "latest|new|hot|categories"
SiteSetting.discourse_directory_enabled = true
SiteSetting.discourse_directory_as_homepage = true
SiteSetting.discourse_directory_instagram_sync_enabled = false
snapshot.fetch("settings").each { |name, value| SiteSetting.public_send("#{name}=", value) }
abort "Snapshot contains images; extend the asset importer before reseeding" if (snapshot["people"] + snapshot["shops"]).any? { |row| row["image"] }

# This local account authors no demonstration content. No production account is copied.
reader = User.find_by(username: "pdx_reader") || User.create!(username: "pdx_reader", name: "Staging test account", email: "pdx_reader@pdx-demo.invalid", password: SecureRandom.base64(40), active: true, approved: true, trust_level: 2)
reader.email_tokens.update_all(confirmed: true)
reader.user_option.update!(enable_quoting: true)

neighborhoods = snapshot.fetch("neighborhoods").to_h do |row|
  record = DiscourseDirectory::Neighborhood.find_or_initialize_by(slug: row.fetch("slug"))
  record.update!(name: row.fetch("name"))
  [record.name, record]
end
styles = snapshot.fetch("specializations").to_h do |row|
  record = DiscourseDirectory::Specialization.find_or_initialize_by(slug: row.fetch("slug"))
  record.update!(name: row.fetch("name"))
  [record.name, record]
end

shops = snapshot.fetch("shops").to_h do |row|
  record = DiscourseDirectory::Shop.find_or_initialize_by(id: row.fetch("id"))
  record.assign_attributes(name: row.fetch("name"), active: true, bio_raw: row.fetch("bio_text"), address: row["address"])
  record.neighborhood = row.fetch("labels").filter_map { |name| neighborhoods[name] }.first
  instagram = row.fetch("links").find { |link| link["href"].include?("instagram.com/") }
  record.instagram_handle = instagram["href"].split("instagram.com/").last.delete_suffix("/") if instagram
  website = row.fetch("links").find { |link| link["label"] == "Website" }
  record.website_url = website["href"] if website
  record.save!
  record.update_columns(bio_cooked: row.fetch("bio_cooked"))
  if row["map"]
    pins = JSON.parse(Nokogiri::HTML.fragment(row["map"]).at_css(".directory-map__data").text)
    pin = pins.find { |p| p["url"] == row["path"] }
    record.update_columns(latitude: pin.fetch("latitude"), longitude: pin.fetch("longitude"), geocoding_error: "") if pin
  end
  [row.fetch("path"), record]
end
entries = snapshot.fetch("people").each_with_index.map do |row, index|
  record = DiscourseDirectory::Entry.find_or_initialize_by(id: row.fetch("id"))
  record.assign_attributes(name: row.fetch("name"), active: true, bio_raw: row.fetch("bio_text"), sort_order: index)
  instagram = row.fetch("links").find { |link| link["href"].include?("instagram.com/") }
  record.instagram_handle = instagram["href"].split("instagram.com/").last.delete_suffix("/") if instagram
  booking = row.fetch("links").find { |link| link["label"].match?(/book/i) }
  record.booking_url = booking["href"] if booking
  record.save!
  record.update_columns(bio_cooked: row.fetch("bio_cooked"))
  record.shops = row.fetch("related").map { |relation| shops.fetch(relation.fetch("path")) }
  record.specializations = row.fetch("labels").filter_map { |name| styles[name] }
  record
end
# Preserve directory IDs so profile links remain portable.
%w[discourse_directory_entries discourse_directory_shops].each { |table| ActiveRecord::Base.connection.reset_pk_sequence!(table) }

snapshot.fetch("categories").each do |row|
  category = Category.find_by(id: row["id"]) || Category.new(id: row["id"], user: Discourse.system_user)
  category.update!(name: row["name"], slug: row["slug"], color: row["color"], text_color: row["text_color"])
end
topics = snapshot.fetch("topics").map do |row|
  post = row.fetch("post_stream").fetch("posts").first
  source = JSON.parse(File.read(File.join(__dir__, "welcome-source.json")))
  raw = source.fetch("posts").find { |p| p["id"] == post["id"] }.fetch("raw")
  topic = Topic.find_by(title: row.fetch("title"))
  unless topic
    post = row.fetch("post_stream").fetch("posts").first
    raise "Snapshot importer currently supports the public system welcome topic" unless post["username"] == "system" && row.fetch("post_stream").fetch("posts").size == 1
    source = JSON.parse(File.read(File.join(__dir__, "welcome-source.json")))
    raw = source.fetch("posts").find { |p| p["id"] == post["id"] }.fetch("raw")
    first = PostCreator.create!(Discourse.system_user, title: row.fetch("title"), raw: raw, category: row.fetch("category_id"), created_at: post["created_at"], skip_validations: true)
    topic = first.topic
    first.update_columns(cooked: post.fetch("cooked"))
  end
  topic.update_columns(created_at: row.fetch("created_at"), bumped_at: row["last_posted_at"] || row.fetch("created_at"), last_posted_at: row["last_posted_at"] || row.fetch("created_at"))
  topic.first_post.update_columns(raw: raw, cooked: post.fetch("cooked"), created_at: post.fetch("created_at"), updated_at: post.fetch("updated_at"), version: post.fetch("version", 1), public_version: post.fetch("version", 1))
  topic.posts.each { |post| SearchIndexer.index(post, force: true) }
  topic
end
state = { source: snapshot["source"], captured_at: snapshot["captured_at"], version: Discourse::VERSION::STRING, commit: `git rev-parse HEAD`.strip, topics: topics.map { |t| { id: t.id, slug: t.slug, title: t.title } }, entries: entries.map { |e| { id: e.id, slug: e.slug, name: e.name } }, reader: reader.username }
File.write(File.join(__dir__, "state.json"), JSON.pretty_generate(state))
puts "Imported #{entries.size} production tattooers, #{shops.size} shops and #{topics.size} public topics."

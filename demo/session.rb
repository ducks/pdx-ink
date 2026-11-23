# frozen_string_literal: true

abort "Local demo only" unless ENV["PDX_DEMO"] == "1" && Rails.env.development?
user = User.find_by!(username: ENV.fetch("PDX_USER", "pdx_reader"))
token = UserAuthToken.generate!(user_id: user.id, user_agent: "PDX Ink browser verification", client_ip: "127.0.0.1")
File.write(File.join(__dir__, "session.json"), JSON.generate({ token: token.unhashed_auth_token }))
File.chmod(0o600, File.join(__dir__, "session.json"))
puts "Wrote local demo browser session."

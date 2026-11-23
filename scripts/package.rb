# frozen_string_literal: true
require "zip"
require "fileutils"
root = File.expand_path("..", __dir__)
FileUtils.mkdir_p(File.join(root, "dist"))
{ "pdx-ink-20260911.zip" => "theme", "pdx-editorial-20260911.zip" => "components/pdx-editorial" }.each do |name, directory|
  destination = File.join(root, "dist", name)
  Zip::OutputStream.open(destination) do |zip|
    Dir.glob(File.join(root, directory, "**", "*")).sort.each do |file|
      next unless File.file?(file)
      zip.put_next_entry(file.delete_prefix(File.join(root, directory) + "/"))
      zip.write(File.binread(file))
    end
  end
  puts destination
end

# frozen_string_literal: true
require "zip"
require "fileutils"
root = File.expand_path("..", __dir__)
FileUtils.mkdir_p(File.join(root, "dist"))
{ "pdx-ink-20260911.zip" => ".", "pdx-editorial-20260911.zip" => "components/pdx-editorial" }.each do |name, directory|
  destination = File.join(root, "dist", name)
  source = File.expand_path(directory, root)
  paths = %w[about.json settings.yml common desktop mobile assets javascripts locales]
  files = paths.flat_map do |path|
    entry = File.join(source, path)
    File.directory?(entry) ? Dir.glob(File.join(entry, "**", "*")) : [entry]
  end
  Zip::OutputStream.open(destination) do |zip|
    files.sort.each do |file|
      next unless File.file?(file)
      zip.put_next_entry(file.delete_prefix(source + "/"))
      zip.write(File.binread(file))
    end
  end
  puts destination
end

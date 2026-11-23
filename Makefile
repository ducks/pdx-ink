.PHONY: package syntax

package:
	bundle exec ruby scripts/package.rb

syntax:
	@for script in scripts/*.mjs; do node --check "$$script" || exit; done
	@for script in demo/*.rb scripts/*.rb; do ruby -c "$$script" || exit; done

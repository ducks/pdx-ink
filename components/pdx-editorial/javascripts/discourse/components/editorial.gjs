import Component from "@glimmer/component";
import { service } from "@ember/service";
import getURL from "discourse/lib/get-url";

// Editorial destinations stay on this site. Invalid records are omitted.
function localPath(path) {
  return typeof path === "string" && /^\/(?!\/)/.test(path) && !/[\\\s]/.test(path)
    ? getURL(path)
    : null;
}

export default class Editorial extends Component {
  @service router;

  get visible() {
    return settings.editorial_enabled && this.router.currentRouteName === "discovery.latest" && !this.args.category && !this.args.tag;
  }

  get directoryURL() { return localPath(settings.directory_path); }
  get features() {
    return settings.features.slice(0, 3).map((feature) => ({
      ...feature,
      href: localPath(feature.path),
      imageURL: feature.image_alt ? localPath(feature.image) : null,
    })).filter((feature) => feature.href && feature.title);
  }

  <template>
    {{#if this.visible}}
      <section class="pdx-editorial" aria-labelledby="pdx-editorial-title">
        <div class="pdx-editorial__intro">
          <div>
            <p class="pdx-eyebrow">{{settings.eyebrow}}</p>
            <h1 id="pdx-editorial-title">{{settings.headline}}</h1>
          </div>
          <div class="pdx-editorial__summary">
            <span class="pdx-editorial__flower" aria-hidden="true">✳</span>
            <p>{{settings.introduction}}</p>
            {{#if this.directoryURL}}<a class="pdx-text-link" href={{this.directoryURL}}>{{settings.directory_label}} <span aria-hidden="true">↗</span></a>{{/if}}
          </div>
        </div>
        {{#if this.features.length}}
          <div class="pdx-editorial__label"><h2>{{settings.curation_label}}</h2><p>{{settings.curation_note}}</p></div>
          <div class="pdx-features">
            {{#each this.features as |feature|}}
              <article class="pdx-feature">
                {{#if feature.imageURL}}
                  <img src={{feature.imageURL}} alt={{feature.image_alt}} width="768" height="512" loading="eager" />
                {{/if}}
                <div class="pdx-feature__body">
                  <p class="pdx-eyebrow">{{feature.kicker}}</p>
                  <h3><a href={{feature.href}}>{{feature.title}} <span aria-hidden="true">↗</span></a></h3>
                  <p>{{feature.description}}</p>
                  {{#if feature.credit}}<small>{{feature.credit}}</small>{{/if}}
                </div>
              </article>
            {{/each}}
          </div>
        {{/if}}
      </section>
    {{/if}}
  </template>
}

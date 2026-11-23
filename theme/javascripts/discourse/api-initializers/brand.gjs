import { apiInitializer } from "discourse/lib/api";
import dAvatar from "discourse/ui-kit/helpers/d-avatar";

export default apiInitializer((api) => {
  const siteSettings = api.container.lookup("service:site-settings");
  api.renderInOutlet("home-logo-contents", <template>
    <span class="sr-only">{{siteSettings.title}}</span>
    <span class="pdx-wordmark" aria-hidden="true">
      <span class="pdx-wordmark__city">{{settings.brand_short_name}}<span class="pdx-star">✳</span></span>
      <span class="pdx-wordmark__descriptor">{{settings.brand_descriptor}}</span>
    </span>
  </template>);
  // The target core's search avatar link has no accessible name.
  api.renderInOutlet("search-results-topic-avatar-wrapper", <template>
    <div class="author">
      <a data-user-card={{@post.username}} href={{@post.userPath}} aria-label={{@post.username}}>
        {{dAvatar @post imageSize="large"}}
      </a>
    </div>
  </template>);
});

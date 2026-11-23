import { apiInitializer } from "discourse/lib/api";
import Editorial from "../components/editorial";

export default apiInitializer((api) => {
  api.renderInOutlet("discovery-list-controls-above", Editorial);
});

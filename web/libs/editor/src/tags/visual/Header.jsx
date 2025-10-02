import { types } from "mobx-state-tree";
import { observer } from "mobx-react";
import { Typography } from "antd";

import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import Registry from "../../core/Registry";
import Tree from "../../core/Tree";
import { guidGenerator } from "../../utils/unique";
import { clamp } from "../../utils/utilities";
import "./Header.scss";

/**
 * The `Header` tag is used to show a header on the labeling interface.
 * @example
 * <!-- Display a header on the labeling interface based on a field in the data -->
 * <View>
 *   <Header value="$text" />
 * </View>
 * @example
 * <!-- Display a static header on the labeling interface -->
 * <View>
 *   <Header value="Please select the class" />
 * </View>
 * @name Header
 * @meta_title Header Tag to Show Headers
 * @meta_description Customize Label Studio with the Header tag to display a header for a labeling task for machine learning and data science projects.
 * @param {string} value              - Text of header, either static text or the field name in data to use for the header
 * @param {number} [size=4]           - Level of header on a page, used to control size of the text
 * @param {string} [style]            - CSS style for the header
 * @param {boolean} [underline=false] - Whether to underline the header
 */
const Model = types.model({
  id: types.optional(types.identifier, guidGenerator),
  type: "header",
  size: types.optional(types.string, "4"),
  style: types.maybeNull(types.string),
  _value: types.optional(types.string, ""),
  value: types.optional(types.string, ""),
  underline: types.optional(types.boolean, false),
});

const HeaderModel = types.compose("HeaderModel", Model, ProcessAttrsMixin);

const HtxHeader = observer(({ item }) => {
  // Hide native Header component - custom menu handles this
  return null;
});

Registry.addTag("header", HeaderModel, HtxHeader);

export { HtxHeader, HeaderModel };

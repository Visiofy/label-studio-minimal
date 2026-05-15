import { observer } from "mobx-react";
import React from "react";
import { isDefined } from "../../utils/utils";

const NullIcon = () => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    title="Null annotation"
    style={{ flexShrink: 0 }}
  >
    <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="2.5" />
    <line x1="8.5" y1="23.5" x2="23.5" y2="8.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const TotalAnnotationsCell = observer(({ original, value }) => {
  if (original?.has_null_annotation) {
    return <NullIcon />;
  }
  return isDefined(value) ? value : "";
});

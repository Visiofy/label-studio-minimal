import type { CSSProperties } from "react";
import { CustomLogo } from "../custom-logo";

export type SpinnerProps = {
  className?: string;
  style?: CSSProperties;
  size?: number;
  stopped?: boolean;
};

export const Spinner = ({ className, style, size = 32, stopped = false }: SpinnerProps) => {
  return (
    <CustomLogo
      className={className}
      style={style}
      size={size}
      animate={!stopped}
      variant="default"
    />
  );
};

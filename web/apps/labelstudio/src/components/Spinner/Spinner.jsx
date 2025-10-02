import { CustomLogo } from "@humansignal/ui/lib/custom-logo";

export const Spinner = ({ className, style, size = 32, stopped = false }) => {
  return (
    <CustomLogo
      className={className}
      style={style}
      size={size}
      animate={!stopped}
      variant="opossum"
    />
  );
};

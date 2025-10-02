import chroma from "chroma-js";
import React, { useMemo } from "react";
import { Block, Elem } from "../../utils/bem";
import { asVars } from "../../utils/styles";

import "./Label.scss";

export const Label = React.forwardRef(
  (
    {
      className,
      style,
      color,
      empty = false,
      hidden = false,
      selected = false,
      margins = false,
      onClick,
      children,
      hotkey,
      ...rest
    },
    ref,
  ) => {
    const styles = useMemo(() => {
      if (!color) return style ?? null;

      try {
        const background = chroma(color).alpha(0.15);

        return {
          ...(style ?? {}),
          ...asVars({
            color,
            background,
          }),
        };
      } catch (error) {
        console.warn('[Label] Error processing color:', error.message, 'color:', color);
        return style ?? null;
      }
    }, [color, style]);

    const handleClick = (e) => {
      try {
        if (onClick && typeof onClick === 'function') {
          onClick(e);
        }
      } catch (error) {
        console.error('[Label] Error in onClick handler:', error);
      }
    };

    try {
      return (
        <Block
          tag="span"
          ref={ref}
          name="label"
          mod={{ empty, hidden, selected, clickable: !!onClick, margins }}
          mix={className}
          style={styles}
          onClick={handleClick}
          {...rest}
        >
          <Elem tag="span" name="text">
            {children}
          </Elem>
          {hotkey ? (
            <Elem tag="span" name="hotkey">
              {hotkey}
            </Elem>
          ) : null}
        </Block>
      );
    } catch (error) {
      console.error('[Label] Error rendering Label component:', error);
      return (
        <span
          ref={ref}
          className={className}
          style={style}
          onClick={handleClick}
        >
          {children}
        </span>
      );
    }
  },
);

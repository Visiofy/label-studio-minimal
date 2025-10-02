import { isAlive } from "mobx-state-tree";
import { observer } from "mobx-react";
import { forwardRef, useCallback, useMemo } from "react";
import { Block, Elem } from "../../utils/bem";
import { FF_LSDV_4711, isFF } from "../../utils/feature-flags";
import messages from "../../utils/messages";
import { ErrorMessage } from "../ErrorMessage/ErrorMessage";
import "./Image.scss";

export const RELATIVE_STAGE_WIDTH = 100;
export const RELATIVE_STAGE_HEIGHT = 100;
export const SNAP_TO_PIXEL_MODE = { EDGE: "edge", CENTER: "center" };

/* ----------  helper sicuro  ---------- */
const safe = (fn, fallback = null) => {
  try {
    return fn();
  } catch (err) {
    if (err?.message?.includes("no longer part of a state tree")) {
      console.warn("[Image] Accesso a nodo MST distrutto bloccato.");
      return fallback;
    }
    throw err;
  }
};

export const Image = observer(
  forwardRef(({ imageEntity, imageTransform, updateImageSize, usedValue, size, overlay }, ref) => {
    /* ----------  early exit se l’entità è morta  ---------- */
    if (!imageEntity || !isAlive(imageEntity)) return null;

    const imageSize = useMemo(() => ({
      width: size.width === 1 ? "100%" : size.width,
      height: size.height === 1 ? "auto" : size.height,
    }), [size]);

    const onLoad = useCallback(
      (event) => {
        if (!isAlive(imageEntity)) return;
        updateImageSize(event);
        imageEntity.setImageLoaded(true);
      },
      [updateImageSize, imageEntity],
    );

    /* ----------  dati sicuri  ---------- */
    const downloading = safe(() => imageEntity.downloading, false);
    const progress    = safe(() => imageEntity.progress, 0);
    const error       = safe(() => imageEntity.error, null);
    const src         = safe(() => imageEntity.src, "");
    const downloaded  = safe(() => imageEntity.downloaded, false);
    const currentSrc  = safe(() => imageEntity.currentSrc, "");
    const imageLoaded = safe(() => imageEntity.imageLoaded, false);

    return (
      <Block name="image" style={imageSize}>
        {overlay}
        <ImageProgress
          downloading={downloading}
          progress={progress}
          error={error}
          src={src}
          usedValue={usedValue}
        />
        {downloaded && (
          <ImageRenderer
            ref={ref}
            src={currentSrc}
            onLoad={onLoad}
            isLoaded={imageLoaded}
            imageTransform={imageTransform}
          />
        )}
      </Block>
    );
  }),
);

/* ----------  sotto-componenti  ---------- */
const ImageProgress = observer(({ downloading, progress, error, src, usedValue }) => {
  if (downloading)
    return (
      <Block name="image-progress">
        <Elem name="message">Downloading image</Elem>
        <Elem tag="progress" name="bar" value={progress} min="0" max={1} step={0.0001} />
      </Block>
    );
  if (error) return <ImageLoadingError src={src} value={usedValue} />;
  return null;
});

const imgDefaultProps = {};
if (isFF(FF_LSDV_4711)) imgDefaultProps.crossOrigin = "anonymous";

const ImageRenderer = observer(
  forwardRef(({ src, onLoad, imageTransform, isLoaded }, ref) => {
    const style = useMemo(
      () => ({ ...imageTransform, maxWidth: "unset", visibility: isLoaded ? "visible" : "hidden" }),
      [imageTransform, isLoaded],
    );

    return <img {...imgDefaultProps} ref={ref} alt="image" src={src} onLoad={onLoad} style={style} />;
  }),
);

const ImageLoadingError = ({ src, value }) => {
  const error = useMemo(() => messages.ERR_LOADING_HTTP({ url: src, error: "", attr: value }), [src]);
  return <ErrorMessage error={error} />;
};
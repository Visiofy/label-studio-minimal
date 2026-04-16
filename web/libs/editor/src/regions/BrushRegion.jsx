import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Group, Image, Layer, Shape } from "react-konva";
import { observer } from "mobx-react";
import { getParent, getRoot, getType, hasParent, isAlive, observe, types } from "mobx-state-tree";

import Registry from "../core/Registry";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Canvas from "../utils/canvas";

import { ImageViewContext } from "../components/ImageView/ImageViewContext";
import { LabelOnMask } from "../components/ImageView/LabelOnRegion";
import { Geometry } from "../components/InteractiveOverlays/Geometry";
import { defaultStyle } from "../core/Constants";
import { guidGenerator } from "../core/Helpers";
import { AreaMixin } from "../mixins/AreaMixin";
import IsReadyMixin from "../mixins/IsReadyMixin";
import { KonvaRegionMixin } from "../mixins/KonvaRegion";
import { ImageModel } from "../tags/object/Image";
import { colorToRGBAArray, rgbArrayToHex } from "../utils/colors";

const safeMobxAccess = (fn, fallback = null) => {
  try {
    return fn();
  } catch (error) {
    if (error.message && error.message.includes('no longer part of a state tree')) {
      console.warn('[SafeMobX] Attempted access to destroyed MobX object:', error.message.substring(0, 100));
      return fallback;
    }
    throw error;
  }
};

const isSafeToUse = (item) => {
  if (!item) return false;
  try {
    return isAlive(item);
  } catch (error) {
    return false;
  }
};
import { FF_DEV_3793, FF_ZOOM_OPTIM, isFF } from "../utils/feature-flags";
import { AliveRegion } from "./AliveRegion";
import { RegionWrapper } from "./RegionWrapper";

const highlightOptions = {
  shadowColor: "red",
  shadowBlur: 1,
  shadowOffsetY: 2,
  shadowOffsetX: 2,
  shadowOpacity: 1,
};

const Points = types
  .model("Points", {
    id: types.optional(types.identifier, guidGenerator),
    type: types.optional(types.enumeration(["add", "eraser"]), "add"),
    points: types.array(types.number),
    relativePoints: types.array(types.number),

    /**
     * Stroke width
     */
    strokeWidth: types.optional(types.number, 25),
    relativeStrokeWidth: types.optional(types.number, 25),
    /**
     * Eraser size
     */
    eraserSize: types.optional(types.number, 25),
  })
  .views((self) => ({
    get store() {
      return getRoot(self);
    },
    get parent() {
      if (!hasParent(self, 2)) return null;
      return getParent(self, 2);
    },
    get stage() {
      return self.parent?.parent;
    },
    get compositeOperation() {
      return self.type === "add" ? "source-over" : "destination-out";
    },
  }))
  .actions((self) => {
    return {
      updateImageSize(wp, hp, sw, sh) {
        self.points = self.relativePoints.map((v, idx) => {
          const isX = !(idx % 2);
          const stageSize = isX ? sw : sh;

          return (v * stageSize) / 100;
        });
        self.strokeWidth = (self.relativeStrokeWidth * sw) / 100;
      },

      setType(type) {
        self.type = type;
      },

      addPoint(x, y) {
        // scale it back because it would be scaled on draw
        x = x / self.parent.scaleX;
        y = y / self.parent.scaleY;
        self.points.push(x);
        self.points.push(y);
      },

      setPoints(points) {
        self.points = points.map((c, i) => c / (i % 2 === 0 ? self.parent.scaleX : self.parent.scaleY));
        self.relativePoints = points.map(
          (c, i) => (c / (i % 2 === 0 ? self.stage.stageWidth : self.stage.stageHeight)) * 100,
        );
        self.relativeStrokeWidth = (self.strokeWidth / self.stage.stageWidth) * 100;
      },

      // rescale points to the new width and height from the original
      rescale(origW, origH, destW) {
        const s = destW / origW;

        return self.points.map((p) => p * s);
      },

      scaledStrokeWidth(origW, origH, destW) {
        const s = destW / origW;

        return s * self.strokeWidth;
      },
    };
  });

/**
 * Rectangle object for Bounding Box
 *
 */
const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),

    type: "brushregion",
    object: types.late(() => types.reference(ImageModel)),

    coordstype: types.optional(types.enumeration(["px", "perc"]), "perc"),

    rle: types.frozen(),

    maskDataURL: types.frozen(),

    touches: types.array(Points),
    currentTouch: types.maybeNull(types.reference(Points)),
  })
  .volatile(() => ({
    /**
     * Higher values will result in a more curvy line. A value of 0 will result in no interpolation.
     */
    tension: 0.0,
    /**
     * Stroke color
     */
    // strokeColor: types.optional(types.string, "red"),

    /**
     * Determines node opacity. Can be any number between 0 and 1
     */
    opacity: 0.6,
    scaleX: 1,
    scaleY: 1,

    // points: types.array(types.array(types.number)),
    // eraserpoints: types.array(types.array(types.number)),

    mode: "brush",

    needsUpdate: 1,
    hideable: true,
    layerRef: undefined,
    imageData: null,
    rleBbox: null, // Bbox calculated from RLE decoding in natural coordinates

    // Flag to track if this is a newly created annotation (just completed drawing)
    // When true: pressing number keys creates NEW annotation with different label
    // When false: pressing number keys changes EXISTING annotation's label
    isNewAnnotation: false,
  }))
  .views((self) => {
    return {
      get parent() {
        return isAlive(self) ? self.object : null;
      },
      get colorParts() {
        const style = self.style || self.tag || defaultStyle;

        // If style doesn't have a valid strokecolor, use defaultStyle
        // This handles cases where a label was deleted but regions still reference it
        if (!style || !style.strokecolor) {
          return colorToRGBAArray(defaultStyle.strokecolor);
        }

        return colorToRGBAArray(style.strokecolor);
      },
      get strokeColor() {
        return rgbArrayToHex(self.colorParts);
      },
      get touchesLength() {
        return self.touches.length;
      },
      get bboxCoordsCanvas() {
        // PRIORITY 1: For touches (manually drawn), calculate accurate bbox from points
        if (self.touches && self.touches.length > 0) {
          const points = { x: [], y: [] };

          // Iterate through ALL touches, not just the first one
          for (const touch of self.touches) {
            if (!touch.points) continue;
            for (let i = 0; i < touch.points.length; i += 2) {
              const curX = touch.points[i];
              const curY = touch.points[i + 1];
              if (Number.isFinite(curX) && Number.isFinite(curY)) {
                points.x.push(curX);
                points.y.push(curY);
              }
            }
          }
          
          if (points.x.length > 0) {
            const bbox = {
              left: Math.min(...points.x),
              top: Math.min(...points.y),
              right: Math.max(...points.x),
              bottom: Math.max(...points.y),
            };
            
            console.log('[BrushRegion] Using touches bbox (ACCURATE from points):', {
              id: self.id,
              bbox,
              touchesCount: self.touches.length,
              pointsCount: points.x.length
            });
            
            return bbox;
          }
        }
        
        // PRIORITY 2: Use bbox calculated from RLE decoding (most accurate for SAM predictions)
        if (self.rleBbox && self.parent) {
          const { minX, minY, maxX, maxY } = self.rleBbox;
          
          // Scale from natural dimensions to stage dimensions
          const scaleX = self.parent.stageWidth / self.parent.naturalWidth;
          const scaleY = self.parent.stageHeight / self.parent.naturalHeight;
          
          const bbox = {
            left: minX * scaleX,
            top: minY * scaleY,
            right: maxX * scaleX,
            bottom: maxY * scaleY,
          };
          
          console.log('[BrushRegion] Using RLE bbox (MOST ACCURATE):', {
            id: self.id,
            rleBboxNatural: self.rleBbox,
            bboxStage: bbox,
            scales: { scaleX, scaleY },
            dimensions: {
              natural: { w: self.parent.naturalWidth, h: self.parent.naturalHeight },
              stage: { w: self.parent.stageWidth, h: self.parent.stageHeight }
            }
          });
          
          return bbox;
        }
        
        // Fallback to imageData calculation if rleBbox not available
        if (!self.imageData) return null;
        
        const imageBBox = Geometry.getImageDataBBox(self.imageData.data, self.imageData.width, self.imageData.height);

        if (!imageBBox) return null;
        
        // DEBUG: Check if maskBounds are available (from SAM prediction)
        const hasMaskBounds = typeof self.maskBoundsMinX === 'number' && 
                             typeof self.maskBoundsMinY === 'number' &&
                             typeof self.maskBoundsMaxX === 'number' &&
                             typeof self.maskBoundsMaxY === 'number';
        
        console.log('[BrushRegion] Mask bounds check:', {
          id: self.id,
          hasMaskBounds,
          maskBounds: hasMaskBounds ? {
            minX: self.maskBoundsMinX,
            minY: self.maskBoundsMinY,
            maxX: self.maskBoundsMaxX,
            maxY: self.maskBoundsMaxY
          } : null
        });
        
        // DEBUG: Count non-transparent pixels
        let nonZeroPixels = 0;
        for (let i = 0; i < self.imageData.data.length; i += 4) {
          if (self.imageData.data[i + 3] > 0) nonZeroPixels++;
        }
        const totalPixels = self.imageData.width * self.imageData.height;
        
        // CRITICAL FIX: Scale bbox from imageData dimensions to STAGE dimensions
        // imageData is captured from the rendered canvas (with pixel ratio)
        // but we need coordinates in stage space (where clicks happen)
        const scaleX = (self.parent?.stageWidth || self.imageData.width) / self.imageData.width;
        const scaleY = (self.parent?.stageHeight || self.imageData.height) / self.imageData.height;
        
        // DEBUG: Log BEFORE scaling
        console.log('[BrushRegion] bboxCoordsCanvas BEFORE scaling:', {
          id: self.id,
          rawBBox: { ...imageBBox }, // Clone to avoid logging modified object
          imageDataSize: { width: self.imageData.width, height: self.imageData.height },
          nonZeroPixels,
          totalPixels,
          coverage: `${(nonZeroPixels / totalPixels * 100).toFixed(2)}%`,
          parentSize: { 
            naturalWidth: self.parent?.naturalWidth, 
            naturalHeight: self.parent?.naturalHeight,
            stageWidth: self.parent?.stageWidth,
            stageHeight: self.parent?.stageHeight
          },
          scaleFactors: { scaleX, scaleY }
        });
        
        imageBBox.x = imageBBox.x * scaleX;
        imageBBox.y = imageBBox.y * scaleY;
        imageBBox.width = imageBBox.width * scaleX;
        imageBBox.height = imageBBox.height * scaleY;
        
        console.log('[BrushRegion] bboxCoordsCanvas AFTER scaling to STAGE dimensions:', {
          id: self.id,
          scaledBBox: { ...imageBBox }
        });
        
        const {
          stageScale: scale = 1,
          zoomingPositionX: offsetX = 0,
          zoomingPositionY: offsetY = 0,
        } = self.parent || {};

        imageBBox.x = imageBBox.x / scale - offsetX / scale;
        imageBBox.y = imageBBox.y / scale - offsetY / scale;
        imageBBox.width = imageBBox.width / scale;
        imageBBox.height = imageBBox.height / scale;
        return {
          left: imageBBox.x,
          top: imageBBox.y,
          right: imageBBox.x + imageBBox.width,
          bottom: imageBBox.y + imageBBox.height,
        };
      },
      /**
       * Brushes are processed in pixels, so percentages are derived values for them,
       * unlike for other tools.
       */
      get bboxCoords() {
        const bbox = self.bboxCoordsCanvas;

        if (!bbox) return null;
        if (!isFF(FF_DEV_3793)) return bbox;

        return {
          left: self.parent.canvasToInternalX(bbox.left),
          top: self.parent.canvasToInternalY(bbox.top),
          right: self.parent.canvasToInternalX(bbox.right),
          bottom: self.parent.canvasToInternalY(bbox.bottom),
        };
      },
    };
  })
  .actions((self) => {
    let pathPoints;
    let cachedPoints;
    let lastPointX = -1;
    let lastPointY = -1;
    let maskImage;

    return {
      afterCreate() {
        self.updateMaskImage();
        
        // DEBUG: Log brush region creation with dimensions
        console.log('[BrushRegion] afterCreate - Region created:', {
          id: self.id,
          parentNaturalWidth: self.parent?.naturalWidth,
          parentNaturalHeight: self.parent?.naturalHeight,
          parentStageWidth: self.parent?.stageWidth,
          parentStageHeight: self.parent?.stageHeight,
          hasMask: !!self.maskDataURL,
          hasRLE: !!self.rle,
        });
      },

      setIsNewAnnotation(value) {
        self.isNewAnnotation = value;
      },

      updateMaskImage() {
        if (self.maskDataURL) {
          if (!maskImage) maskImage = new window.Image();

          maskImage.src = self.maskDataURL;
        }
      },

      getMaskImage() {
        return maskImage;
      },

      setLayerRef(ref) {
        if (ref) {
          ref.canvas._canvas.style.opacity = self.opacity;
          self.layerRef = ref;
        }
      },

      setRleBbox(bbox) {
        self.rleBbox = bbox;
      },

      cacheImageData() {
        if (!self.layerRef) {
          self.imageData = null;
        } else {
          const canvas = self.layerRef.toCanvas();
          const ctx = canvas.getContext("2d");

          self.imageData = ctx.getImageData(0, 0, self.layerRef.canvas.width, self.layerRef.canvas.height);
        }
      },

      prepareCoords([x, y]) {
        return self.parent.zoomOriginalCoords([x, y]);
      },

      preDraw(x, y) {
        if (!self.layerRef) return;
        const layer = self.layerRef;
        const ctx = layer.canvas.context;

        ctx.save();
        if (isFF(FF_ZOOM_OPTIM)) {
          ctx.beginPath();
          ctx.rect(
            self.parent.alignmentOffset.x,
            self.parent.alignmentOffset.y,
            self.parent.stageWidth * self.parent.stageScale,
            self.parent.stageHeight * self.parent.stageScale,
          );
          ctx.clip();
        }
        ctx.beginPath();
        if (cachedPoints.length / 2 > 3) {
          ctx.moveTo(...self.prepareCoords([lastPointX, lastPointY]));
        } else if (cachedPoints.length === 0) {
          ctx.moveTo(...self.prepareCoords([x, y]));
        } else {
          ctx.moveTo(...self.prepareCoords([cachedPoints[0], cachedPoints[1]]));
          for (let i = 0; i < cachedPoints.length / 2; i++) {
            ctx.lineTo(...self.prepareCoords([cachedPoints[2 * i], cachedPoints[2 * i + 1]]));
          }
        }
        ctx.lineTo(...self.prepareCoords([x, y]));
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = pathPoints.strokeWidth * self.scaleX * self.parent.stageScale;
        ctx.strokeStyle = self.strokeColor;
        ctx.globalCompositeOperation = pathPoints.compositeOperation;
        ctx.stroke();
        ctx.restore();
        lastPointX = x;
        lastPointY = y;
      },

      beginPath({ type, strokeWidth, opacity = self.opacity }) {
        // don't start to save another regions in the middle of drawing process
        self.object.annotation.pauseAutosave();

        pathPoints = Points.create({ id: guidGenerator(), type, strokeWidth, opacity });
        cachedPoints = [];
        return pathPoints;
      },

      addPoint(x, y) {
        self.preDraw(x, y);
        cachedPoints.push(x);
        cachedPoints.push(y);
      },

      endPath() {
        const { annotation } = self.object;

        // will resume in the next tick...
        annotation.startAutosave();

        if (cachedPoints.length === 2) {
          cachedPoints.push(cachedPoints[0]);
          cachedPoints.push(cachedPoints[1]);
        }
        self.touches.push(pathPoints);
        self.currentTouch = pathPoints;
        pathPoints.setPoints(cachedPoints);
        lastPointX = lastPointY = -1;
        pathPoints = null;
        cachedPoints = [];

        self.notifyDrawingFinished();

        // ...so we run this toggled function also delayed
        annotation.autosave && setTimeout(() => annotation.autosave());
      },

      endUpdatedMaskDataURL(maskDataURL) {
        const { annotation } = self.object;

        // will resume in the next tick...
        annotation.startAutosave();

        self.maskDataURL = maskDataURL;
        self.updateMaskImage();

        self.notifyDrawingFinished();

        // ...so we run this toggled function also delayed
        annotation.autosave && setTimeout(() => annotation.autosave());
      },

      convertPointsToMask() {},

      setScale(x, y) {
        self.scaleX = x;
        self.scaleY = y;
      },

      updateImageSize(wp, hp, sw, sh) {
        if (self.parent.stageWidth > 1 && self.parent.stageHeight > 1) {
          self.touches.forEach((stroke) => stroke.updateImageSize(wp, hp, sw, sh));

          self.needsUpdate = self.needsUpdate + 1;
        }
      },

      addState(state) {
        self.states.push(state);
      },

      convertToImage() {
        if (self.touches.length) {
          const object = self.object;
          const rle = Canvas.Region2RLE(self, object, {
            color: self.strokeColor,
          });

          self.touches = [];
          self.rle = Array.from(rle);
        }
      },

      /**
       * @example
       * {
       *   "original_width": 1920,
       *   "original_height": 1280,
       *   "image_rotation": 0,
       *   "value": {
       *     "format": "rle",
       *     "rle": [0, 1, 1, 2, 3],
       *     "brushlabels": ["Car"]
       *   }
       * }
       * @typedef {Object} BrushRegionResult
       * @property {number} original_width  - Width of the original image (px)
       * @property {number} original_height - Height of the original image (px)
       * @property {number} image_rotation  - Rotation degree of the image (deg)
       * @property {Object} value
       * @property {"rle"} value.format     - Format of the masks, only RLE is supported for now
       * @property {number[]} value.rle     - RLE-encoded image
       */

      /**
       * @param {object} options
       * @param {boolean} [options.fast] Saving only touches, without RLE
       * @return {BrushRegionResult}
       */
      serialize(options) {
        const object = self.object;
        const value = { format: "rle" };

        if (options?.fast) {
          value.rle = self.rle;

          if (self.touches.length) value.touches = self.touches;
          if (self.maskDataURL) value.maskDataURL = self.maskDataURL;
        } else {
          const rle = Canvas.Region2RLE(self, object);

          if (!rle || !rle.length) return null;

          // UInt8Array serializes as object, not an array :(
          value.rle = Array.from(rle);
        }

        return self.parent.createSerializedResult(self, value);
      },
    };
  });

const BrushRegionModel = types.compose(
  "BrushRegionModel",
  RegionsMixin,
  NormalizationMixin,
  AreaMixin,
  KonvaRegionMixin,
  IsReadyMixin,
  Model,
);

const HtxBrushLayer = observer(({ item, setShapeRef, pointsList }) => {
  const drawLine = useCallback((ctx, { points, strokeWidth, strokeColor, compositeOperation }) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    for (let i = 0; i < points.length / 2; i++) {
      ctx.lineTo(points[2 * i], points[2 * i + 1]);
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;
    ctx.globalCompositeOperation = compositeOperation;
    ctx.stroke();
    ctx.restore();
  });

  const sceneFunc = useCallback(
    (context) => {
      pointsList.forEach((points) => {
        drawLine(context, {
          points: points.points,
          strokeWidth: points.strokeWidth,
          strokeColor: item.strokeColor,
          compositeOperation: points.compositeOperation,
        });
      });
    },
    [pointsList, pointsList.length, item.strokeColor],
  );

  const hitFunc = useCallback(
    (context, shape) => {
      pointsList.forEach((points) => {
        drawLine(context, {
          points: points.points,
          strokeWidth: points.strokeWidth,
          strokeColor: points.type === "eraser" ? "#ffffff" : shape.colorKey,
          compositeOperation: "source-over",
        });
      });
    },
    [pointsList, pointsList.length],
  );

  return <Shape ref={(node) => setShapeRef(node)} sceneFunc={sceneFunc} hitFunc={hitFunc} />;
});

const HtxBrushView = ({ item, setShapeRef }) => {
  const [image, setImage] = useState();
  const { suggestion } = useContext(ImageViewContext) ?? {};

  const isItemAlive = isSafeToUse(item);
  const safeItemAccess = (getter, fallback = null) => {
    if (!isItemAlive) return fallback;
    return safeMobxAccess(getter, fallback);
  };

  const parent = safeItemAccess(() => item.parent, null);

  // Prepare brush stroke from RLE with current stroke color
  useEffect(() => {
    // Two possible ways to draw an image from precreated data:
    // - rle - An RLE encoded RGBA image
    // - maskDataURL - an RGBA mask encoded as an image data URL that can be directly placed into
    //  an image without having to go through an RLE encode/decode loop to save performance for tools
    //  that dynamically produce image masks.
    const prepareImage = async () => {
      if (!isSafeToUse(item)) return;

      const rle = safeMobxAccess(() => item.rle);
      const maskDataURL = safeMobxAccess(() => item.maskDataURL);

        if (!isSafeToUse(item)) return;

        if (!rle && !maskDataURL) return;
        const naturalWidth = safeItemAccess(() => item.parent?.naturalWidth, 0);
        const naturalHeight = safeItemAccess(() => item.parent?.naturalHeight, 0);
        
        // DEBUG: Log image dimensions when preparing RLE/mask
        console.log('[BrushRegion] prepareImage - Dimensions check:', {
          id: safeMobxAccess(() => item.id),
          naturalWidth,
          naturalHeight,
          hasRLE: !!rle,
          hasMaskDataURL: !!maskDataURL,
          parentStageSize: {
            width: safeItemAccess(() => item.parent?.stageWidth, 0),
            height: safeItemAccess(() => item.parent?.stageHeight, 0)
          }
        });
        
        if (naturalWidth <= 1 || naturalHeight <= 1) return;

      let img;

      if (maskDataURL) {
        const strokeColor = safeMobxAccess(() => item.strokeColor);
        img = await Canvas.maskDataURL2Image(maskDataURL, { color: strokeColor });
      } else if (rle) {
        const strokeColor = safeMobxAccess(() => item.strokeColor);
        img = Canvas.RLE2Region(item, { color: strokeColor });
      }

      if (img) {
        img.onload = () => {
          setImage(img);
          if (isSafeToUse(item)) {
            // Store bbox from RLE if available
            if (img._rleBbox) {
              console.log('[BrushRegion] Setting rleBbox from image:', {
                id: safeMobxAccess(() => item.id),
                rleBbox: img._rleBbox
              });
              safeMobxAccess(() => item.setRleBbox(img._rleBbox));
            } else {
              console.log('[BrushRegion] No rleBbox on image:', {
                id: safeMobxAccess(() => item.id),
                hasRle: !!rle,
                hasMaskDataURL: !!maskDataURL
              });
            }
            safeMobxAccess(() => item.setReady(true));
          }
        };
      }
    };

    if (!isItemAlive) return;
    prepareImage();
  }, [
    isItemAlive,
    safeItemAccess(() => item.rle),
    safeItemAccess(() => item.maskDataURL),
    safeItemAccess(() => item.maskBoundsMinX),
    safeItemAccess(() => item.maskBoundsMinY),
    safeItemAccess(() => item.maskBoundsMaxX),
    safeItemAccess(() => item.maskBoundsMaxY),
    safeItemAccess(() => item.parent),
    safeItemAccess(() => item.parent?.naturalWidth),
    safeItemAccess(() => item.parent?.naturalHeight),
    safeItemAccess(() => item.strokeColor),
    safeItemAccess(() => item.opacity),
  ]);

  // Drawing hit area by shape color to detect interactions inside the Konva
  const imageHitFunc = useMemo(() => {
    let imageData;

    return (context, shape) => {
      if (!isSafeToUse(item)) return;
      const stageParent = safeItemAccess(() => item.parent, null);
      if (!stageParent) return;
      if (image) {
        if (!imageData) {
          context.drawImage(image, 0, 0, stageParent.stageWidth, stageParent.stageHeight);
          if (isFF(FF_ZOOM_OPTIM)) {
            imageData = context.getImageData(
              stageParent.alignmentOffset.x,
              stageParent.alignmentOffset.y,
              stageParent.stageWidth,
              stageParent.stageHeight,
            );
          } else {
            imageData = context.getImageData(0, 0, stageParent.stageWidth, stageParent.stageHeight);
          }
          const colorParts = colorToRGBAArray(shape.colorKey);

          for (let i = imageData.data.length / 4 - 1; i >= 0; i--) {
            if (imageData.data[i * 4 + 3] > 0) {
              for (let k = 0; k < 3; k++) {
                imageData.data[i * 4 + k] = colorParts[k];
              }
            }
          }
        }
        context.putImageData(imageData, 0, 0);
      }
    };
  }, [
    image,
    safeItemAccess(() => item.parent?.stageWidth),
    safeItemAccess(() => item.parent?.stageHeight),
    safeItemAccess(() => item.parent?.alignmentOffset?.x),
    safeItemAccess(() => item.parent?.alignmentOffset?.y),
  ]);

  const { store } = item;

  const highlightedImageRef = useRef(new window.Image());
  const layerRef = useRef();
  const highlightedRef = useRef({});

  // Observe highlighted changes to trigger re-render when hovering over region in outliner
  const [isHighlighted, setIsHighlighted] = useState(item.highlighted);

  useEffect(() => {
    try {
      const dispose = observe(item, "highlighted", ({ newValue }) => {
        setIsHighlighted(newValue);
      }, true);
      return () => dispose();
    } catch (e) {
      return () => {};
    }
  }, [item]);

  // Update ref for drawCallback (used in useMemo)
  highlightedRef.current.highlighted = isHighlighted;

  // Calculate highlight props from state (not ref) so React re-renders when it changes
  const highlightStyle = isHighlighted ? highlightOptions : { shadowOpacity: 0 };

  // Caching drawn brush strokes (from the rle field and from the touches field) for bounding box calculations and highlight applying
  const drawCallback = useMemo(() => {
    let done = false;

    return async () => {
      const { highlighted } = highlightedRef.current;
      const layer = layerRef.current;
      const isDrawing = safeItemAccess(() => item.parent?.drawingRegion === item, false);

      if (isDrawing || !layer || done) return;
      let highlightEl;

      if (highlighted) {
        highlightEl = layer.findOne(".highlight");
        highlightEl.hide();
      }
      layer.draw();

      const dataUrl = layer.canvas.toDataURL();

      item.cacheImageData();

      if (highlighted) {
        highlightEl.show();
        layer.draw();
      }

      highlightedImageRef.current.src = dataUrl;
      done = true;
    };
  }, [
    safeItemAccess(() => item.touches?.length, 0),
    safeItemAccess(() => item.strokeColor),
    safeItemAccess(() => item.parent?.stageScale),
    store.annotationStore.selected?.id,
    safeItemAccess(() => item.parent?.zoomingPositionX),
    safeItemAccess(() => item.parent?.zoomingPositionY),
    safeItemAccess(() => item.parent?.stageWidth),
    safeItemAccess(() => item.parent?.stageHeight),
    safeItemAccess(() => item.maskDataURL),
    safeItemAccess(() => item.rle),
    image,
    isHighlighted, // Re-create callback when highlight changes
  ]);

  const setLayerRef = useCallback(
    (ref) => {
      if (isAlive(item)) {
        item.setLayerRef(ref);
      }
    },
    [item],
  );

  if (!isItemAlive || !parent) return null;

  const stage = parent?.stageRef;
  const highlightProps = isFF(FF_ZOOM_OPTIM)
    ? {
        scaleX: 1 / parent.zoomScale,
        scaleY: 1 / parent.zoomScale,
        x: -(parent.zoomingPositionX + parent.alignmentOffset.x) / parent.zoomScale,
        y: -(parent.zoomingPositionY + parent.alignmentOffset.y) / parent.zoomScale,
        width: item.containerWidth,
        height: item.containerHeight,
      }
    : {
        scaleX: 1 / parent.stageScale,
        scaleY: 1 / parent.stageScale,
        x: -parent.zoomingPositionX / parent.stageScale,
        y: -parent.zoomingPositionY / parent.stageScale,
        width: parent.canvasSize.width,
        height: parent.canvasSize.height,
      };
  const clip = isFF(FF_ZOOM_OPTIM)
    ? {
        x: 0,
        y: 0,
        width: parent.stageWidth,
        height: parent.stageHeight,
      }
    : null;

  return (
    <RegionWrapper item={item}>
      <Layer
        id={item.cleanId}
        ref={(ref) => {
          setLayerRef(ref);
          layerRef.current = ref;
        }}
        onDraw={() => {
          setTimeout(drawCallback);
        }}
        clearBeforeDraw={!item.isDrawing}
        visible={!item.hidden}
        clip={clip}
      >
        <Group
          attrMy={item.needsUpdate}
          name="segmentation"
          // onClick={e => {
          //     e.cancelBubble = false;
          // }}
          onMouseDown={(e) => {
            if (store.annotationStore.selected.isLinkingMode) {
              e.cancelBubble = true;
            }
          }}
          onMouseOver={() => {
            if (store.annotationStore.selected.isLinkingMode) {
              item.setHighlight(true);
            }
            item.updateCursor(true);
          }}
          onMouseOut={() => {
            if (store.annotationStore.selected.isLinkingMode) {
              item.setHighlight(false);
            }
            item.updateCursor();
          }}
          onClick={(e) => {
            if (parent.getSkipInteractions()) return;
            if (store.annotationStore.selected.isLinkingMode) {
              item.onClickRegion(e);
              return;
            }

            if (!isFF(FF_ZOOM_OPTIM)) {
              const tool = parent.getToolsManager().findSelectedTool();
              const isMoveTool = tool && getType(tool).name === "MoveTool";

              if (tool && !isMoveTool) return;
            }

            if (store.annotationStore.selected.isLinkingMode) {
              stage.container().style.cursor = "default";
            }

            item.setHighlight(false);
            item.onClickRegion(e);
          }}
          listening={!suggestion}
        >
          {/* RLE */}
          <Image image={image} hitFunc={imageHitFunc} width={parent.stageWidth} height={parent.stageHeight} />

          {/* Touches */}
          <Group>
            <HtxBrushLayer store={store} item={item} pointsList={item.touches} setShapeRef={setShapeRef} />
          </Group>

          {/* Highlight */}
          <Image
            name="highlight"
            image={highlightedImageRef.current}
            sceneFunc={isHighlighted ? null : () => {}}
            hitFunc={() => {}}
            {...highlightStyle}
            {...highlightProps}
            listening={false}
          />
        </Group>
      </Layer>
      <Layer
        id={`${item.cleanId}_labels`}
        ref={(ref) => {
          if (ref) {
            ref.canvas._canvas.style.opacity = item.opacity;
          }
        }}
      >
        <Group>
          <LabelOnMask item={item} color={item.strokeColor} />
        </Group>
      </Layer>
    </RegionWrapper>
  );
};

const HtxBrush = AliveRegion(HtxBrushView, {
  renderHidden: true,
  shouldNotUsePortal: true,
});

Registry.addTag("brushregion", BrushRegionModel, HtxBrush);
Registry.addRegionType(BrushRegionModel, "image", (value) => value.rle || value.touches || value.maskDataURL);

export { BrushRegionModel, HtxBrush };

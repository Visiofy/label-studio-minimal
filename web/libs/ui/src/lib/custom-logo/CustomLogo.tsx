import React from "react";
import styles from "./custom-logo.module.scss";
import { cn } from "@humansignal/shad/utils";

export interface CustomLogoProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number | string;
  animate?: boolean;
  variant?: "default" | "opossum"; // default per spinner CSS, opossum per sostituire l'opossum
}

export const CustomLogo: React.FC<CustomLogoProps> = ({
  className,
  style,
  size = 48,
  animate = true,
  variant = "default"
}) => {
  const sizeValue = typeof size === "number" ? `${size}px` : size;

  // SVG BIOND completo con animazione delle lettere
  const BiondAnimatedSVG = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 816.4 229.6"
      width="100%"
      height="100%"
    >
      <defs>
        <style>
          {`.cls-1 { fill: #000000; stroke-width: 0px; }`}
        </style>
      </defs>

      {/* I */}
      <path className="cls-1" id="element-0" d="M144.1,51.1h27.9v126.8h-27.9V51.1Z" opacity="0">
        {animate && (
          <>
            <animate attributeName="opacity" from="0" to="1" dur="0.05s" begin="0.20s" fill="freeze"/>
            <animateTransform attributeName="transform" type="translate" dur="0.05s" begin="0.20s"
              values="-144,0;0,0" keyTimes="0;1" calcMode="spline"
              keySplines="0.25 1 0.5 1" fill="freeze"/>
          </>
        )}
      </path>

      {/* I */}
      <path className="cls-1" id="element-1" d="M216.4,51.1h27.9v126.8h-27.9V51.1Z" opacity="0">
        {animate && (
          <>
            <animate attributeName="opacity" from="0" to="1" dur="0.05s" begin="0.15s" fill="freeze"/>
            <animateTransform attributeName="transform" type="translate" dur="0.05s" begin="0.15s"
              values="-216,0;0,0" keyTimes="0;1" calcMode="spline"
              keySplines="0.25 1 0.5 1" fill="freeze"/>
          </>
        )}
      </path>

      {/* O */}
      <path className="cls-1" id="element-2" d="M281.4,114.5c0-37,29.5-65.8,68.1-65.8s68.1,28.8,68.1,65.8-29.5,66-68.1,66-68.1-29-68.1-66ZM389.8,114.5c0-23.4-18.1-39.9-40.4-39.9s-40.4,16.5-40.4,39.9,18.1,39.9,40.4,39.9,40.4-16.5,40.4-39.9Z" opacity="0">
        {animate && (
          <>
            <animate attributeName="opacity" from="0" to="1" dur="0.05s" begin="0.10s" fill="freeze"/>
            <animateTransform attributeName="transform" type="translate" dur="0.05s" begin="0.10s"
              values="-281,0;0,0" keyTimes="0;1" calcMode="spline"
              keySplines="0.25 1 0.5 1" fill="freeze"/>
          </>
        )}
      </path>

      {/* N */}
      <path className="cls-1" id="element-3" d="M454.6,51.1h27.6l64.3,85.8V51.1h27.7v126.8h-27.3l-64.5-85.6v85.6h-27.9V51.1Z" opacity="0">
        {animate && (
          <>
            <animate attributeName="opacity" from="0" to="1" dur="0.05s" begin="0.05s" fill="freeze"/>
            <animateTransform attributeName="transform" type="translate" dur="0.05s" begin="0.05s"
              values="-454,0;0,0" keyTimes="0;1" calcMode="spline"
              keySplines="0.25 1 0.5 1" fill="freeze"/>
          </>
        )}
      </path>

      {/* D */}
      <path className="cls-1" id="element-5" d="M698.3,51.1l43.1-.2c45.6-.2,74.1,26.8,74.1,63.8s-28.5,63.2-74.1,63.2h-43.1V51.1ZM741.3,152.6c32-.1,46.3-14.5,46.3-37.8s-14.3-38.4-46.3-38.7h-15.3c0-.1,0,76.6,0,76.6h15.3Z" opacity="0">
        {animate && (
          <>
            <animate attributeName="opacity" from="0" to="1" dur="0.05s" begin="0s" fill="freeze"/>
            <animateTransform attributeName="transform" type="translate" dur="0.05s" begin="0s"
              values="-698,0;0,0" keyTimes="0;1" calcMode="spline"
              keySplines="0.25 1 0.5 1" fill="freeze"/>
          </>
        )}
      </path>

      {/* Trattino (-) */}
      <path className="cls-1" id="element-4" d="M608.7,103.6h55.2v22.8h-55.2v-22.8Z" opacity="0">
        {animate && (
          <animate attributeName="opacity" from="0" to="1" dur="0.25s" begin="0.25s" fill="freeze"/>
        )}
      </path>

      {/* B (triangolo superiore) */}
      <polygon className="cls-1" id="element-6" points=".9 111.9 107.1 74.8 21.9 1.4 .9 111.9"/>
      {/* B (triangolo inferiore) */}
      <polygon className="cls-1" id="element-7" points="109.5 148.7 .9 119.6 30 228.2 109.5 148.7"/>
    </svg>
  );

  // Versione semplificata per spinner (solo triangoli che ruotano)
  const BiondSpinnerSVG = (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 816.4 229.6"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* B (triangolo superiore) - rotazione veloce */}
      <polygon
        points=".9 111.9 107.1 74.8 21.9 1.4 .9 111.9"
        fill="#000000"
        strokeWidth="0px"
        transformOrigin="center"
        style={{transformBox: 'fill-box'}}
        id="element-0"
      >
        {animate && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            begin="-0.00001s"
            dur="0.15s"
            keyTimes="0;1"
            values="0;360"
            fill="freeze"
            additive="sum"
            calcMode="spline"
            keySplines="0 0 1 1"
            repeatCount="indefinite"
          />
        )}
      </polygon>

      {/* B (triangolo inferiore) - rotazione lenta */}
      <polygon
        points="109.5 148.7 .9 119.6 30 228.2 109.5 148.7"
        fill="#000000"
        strokeWidth="0px"
        transformOrigin="center"
        style={{transformBox: 'fill-box'}}
        id="element-1"
      >
        {animate && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            begin="-0.00001s"
            dur="0.40802s"
            keyTimes="0;1"
            values="0;360"
            fill="freeze"
            additive="sum"
            calcMode="spline"
            keySplines="0 0 1 1"
            repeatCount="indefinite"
          />
        )}
      </polygon>
    </svg>
  );

  // Per l'opossum usiamo l'animazione completa
  const BiondOpossumSVG = BiondAnimatedSVG;

  return (
    <div
      className={cn(styles.customLogo, animate && styles.animate, className)}
      style={{
        ...style,
        width: sizeValue,
        height: sizeValue,
      }}
    >
      {variant === "opossum" ? BiondOpossumSVG : BiondSpinnerSVG}
    </div>
  );
};

export default CustomLogo;
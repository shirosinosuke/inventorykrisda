import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeViewProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export const BarcodeView: React.FC<BarcodeViewProps> = ({
  value,
  width = 1.5,
  height = 42,
  displayValue = true,
  fontSize = 12,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: fontSize,
          margin: 4,
          font: 'monospace',
          textMargin: 3,
        });
      } catch (err) {
        console.error('JsBarcode rendering error:', err);
      }
    }
  }, [value, width, height, displayValue, fontSize]);

  return <svg ref={svgRef} className={`max-w-full ${className}`} />;
};

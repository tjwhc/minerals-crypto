"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from "lightweight-charts";

type Point = { time: number; value: number; volume: number };

type Props = {
  data: Point[];
};

export default function MetalHistoryChart({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0a0a0a" },
        textColor: "#d4d4d8",
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      rightPriceScale: { borderColor: "#27272a" },
      timeScale: { borderColor: "#27272a", timeVisible: true, secondsVisible: false },
      crosshair: { mode: 0 },
      width: ref.current.clientWidth,
      height: 300,
    });

    const candleOptions = {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    };

    const volumeOptions = {
      color: "#64748b",
      priceFormat: { type: "volume" },
      priceScaleId: "",
      scaleMargins: { top: 0.8, bottom: 0 },
    };

    const chartAny = chart as any;
    const candleSeries = chartAny.addCandlestickSeries
      ? chartAny.addCandlestickSeries(candleOptions)
      : chartAny.addSeries
      ? chartAny.addSeries(CandlestickSeries || "Candlestick", candleOptions)
      : null;

    const volumeSeries = chartAny.addHistogramSeries
      ? chartAny.addHistogramSeries(volumeOptions)
      : chartAny.addSeries
      ? chartAny.addSeries(HistogramSeries || "Histogram", volumeOptions)
      : null;

    const sorted = [...data]
      .sort((a, b) => a.time - b.time)
      .filter((p, i, arr) => i === 0 || p.time > arr[i - 1].time);
    const candles = sorted.map((p) => ({
      time: p.time as any,
      open: p.value,
      high: p.value,
      low: p.value,
      close: p.value,
    }));

    const volumes = sorted.map((p) => ({
      time: p.time as any,
      value: p.volume || 1,
    }));

    candleSeries?.setData?.(candles);
    volumeSeries?.setData?.(volumes);

    const handleResize = () => {
      if (ref.current) {
        chart.applyOptions({ width: ref.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data]);

  return <div ref={ref} className="w-full" />;
}

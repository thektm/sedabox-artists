import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { Activity, BarChart3 } from "lucide-react";

export type ChartView = "timeline" | "classic";

interface TimelinePoint {
  label: string;
  value: number;
}

interface PremiumTimelineChartProps {
  points: TimelinePoint[];
  seriesName: string;
  valueFormatter: (value: number) => string;
  axisValueFormatter?: (value: number) => string;
  axisLabelFormatter?: (label: string) => string;
  tooltipLabelFormatter?: (label: string) => string;
  emptyText: string;
  height?: number;
  integerValues?: boolean;
  initialWindow?: number | "all";
}

interface TooltipPoint {
  axisValue?: string;
  marker?: string;
  value?: number;
  data?: number;
}

export const ChartViewToggle: React.FC<{
  value: ChartView;
  onChange: (value: ChartView) => void;
}> = ({ value, onChange }) => (
  <div
    className="inline-flex shrink-0 rounded-xl border border-[#343434] bg-[#202020] p-1"
    role="group"
    aria-label="نوع نمایش نمودار"
    onClick={(event) => event.stopPropagation()}
  >
    <button
      type="button"
      onClick={() => onChange("timeline")}
      aria-pressed={value === "timeline"}
      title="نمای خطی نمودار"
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
        value === "timeline"
          ? "bg-[#1DB954] text-black shadow-[0_6px_18px_rgba(29,185,84,.18)]"
          : "text-[#969696] hover:text-white"
      }`}
    >
      <Activity className="h-3.5 w-3.5" /> خطی
    </button>
    <button
      type="button"
      onClick={() => onChange("classic")}
      aria-pressed={value === "classic"}
      title="نمای کلاسیک"
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
        value === "classic"
          ? "bg-[#343434] text-white"
          : "text-[#969696] hover:text-white"
      }`}
    >
      <BarChart3 className="h-3.5 w-3.5" /> کلاسیک
    </button>
  </div>
);

const PremiumTimelineChart: React.FC<PremiumTimelineChartProps> = ({
  points,
  seriesName,
  valueFormatter,
  axisValueFormatter = valueFormatter,
  axisLabelFormatter = (label) => label,
  tooltipLabelFormatter = axisLabelFormatter,
  emptyText,
  height = 272,
  integerValues = true,
  initialWindow = 14,
}) => {
  const option = useMemo(() => {
    const labels = points.map((point) => point.label);
    const values = points.map((point) => point.value);
    const showZoom = points.length > 14;
    const visiblePoints = initialWindow === "all" ? points.length : Math.max(1, initialWindow);
    const zoomStart = showZoom ? Math.max(0, 100 - (visiblePoints / points.length) * 100) : 0;
    const hasPositiveValue = values.some((value) => value > 0);

    return {
      backgroundColor: "transparent",
      animationDuration: 900,
      animationDurationUpdate: 450,
      animationEasing: "cubicOut",
      animationEasingUpdate: "cubicOut",
      aria: { enabled: true, decal: { show: false } },
      grid: {
        left: 12,
        right: 14,
        top: 22,
        bottom: showZoom ? 52 : 12,
        containLabel: true,
      },
      tooltip: {
        trigger: "axis",
        confine: true,
        transitionDuration: 0.15,
        backgroundColor: "rgba(20,20,20,.94)",
        borderColor: "rgba(255,255,255,.12)",
        borderWidth: 1,
        padding: [10, 12],
        textStyle: { color: "#fff", fontFamily: "inherit" },
        extraCssText: "border-radius:12px;box-shadow:0 14px 40px rgba(0,0,0,.38);backdrop-filter:blur(12px);",
        axisPointer: {
          type: "line",
          snap: true,
          lineStyle: { color: "rgba(255,255,255,.24)", width: 1 },
          label: { show: false },
        },
        formatter: (params: TooltipPoint[]) => {
          const point = params.find((item) => item.value !== undefined || item.data !== undefined);
          const value = Number(point?.value ?? point?.data ?? 0);
          const label = tooltipLabelFormatter(point?.axisValue || "");
          return `<div style="direction:rtl;min-width:120px"><div style="color:#919191;font-size:11px;margin-bottom:5px">${label}</div><div style="display:flex;align-items:center;gap:7px"><span style="width:8px;height:8px;border-radius:999px;background:#1DB954;box-shadow:0 0 12px rgba(29,185,84,.75)"></span><strong style="font-size:13px">${valueFormatter(value)}</strong></div></div>`;
        },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: labels,
        axisLine: { show: true, lineStyle: { color: "#343434" } },
        axisTick: { show: false },
        axisLabel: {
          color: "#858585",
          fontSize: 10,
          hideOverlap: true,
          margin: 12,
          formatter: axisLabelFormatter,
          alignMinLabel: "left",
          alignMaxLabel: "right",
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0,
        minInterval: integerValues ? 1 : undefined,
        scale: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#737373",
          fontSize: 10,
          margin: 10,
          formatter: axisValueFormatter,
        },
        splitLine: {
          show: true,
          lineStyle: { color: "rgba(255,255,255,.055)", type: "dashed" },
        },
      },
      dataZoom: showZoom
        ? [
            { type: "inside", start: zoomStart, end: 100, zoomOnMouseWheel: true, moveOnMouseMove: true },
            {
              type: "slider",
              start: zoomStart,
              end: 100,
              height: 16,
              bottom: 4,
              borderColor: "transparent",
              backgroundColor: "rgba(255,255,255,.04)",
              fillerColor: "rgba(29,185,84,.15)",
              dataBackground: {
                lineStyle: { color: "rgba(29,185,84,.35)" },
                areaStyle: { color: "rgba(29,185,84,.08)" },
              },
              selectedDataBackground: {
                lineStyle: { color: "#1DB954" },
                areaStyle: { color: "rgba(29,185,84,.16)" },
              },
              handleStyle: { color: "#1DB954", borderColor: "#1DB954" },
              moveHandleStyle: { color: "rgba(29,185,84,.8)" },
              textStyle: { color: "#777", fontSize: 9 },
              brushSelect: false,
            },
          ]
        : [],
      series: [
        {
          name: `${seriesName}-glow`,
          type: "line",
          data: values,
          smooth: 0.42,
          silent: true,
          showSymbol: false,
          lineStyle: {
            width: 10,
            color: "rgba(29,185,84,.08)",
            shadowBlur: 18,
            shadowColor: "rgba(29,185,84,.28)",
          },
          z: 1,
        },
        {
          name: seriesName,
          type: "line",
          data: values,
          smooth: 0.42,
          connectNulls: true,
          showSymbol: points.length <= 8,
          symbol: "circle",
          symbolSize: 7,
          sampling: "lttb",
          lineStyle: {
            width: 3,
            color: "#1DB954",
            cap: "round",
            join: "round",
            shadowBlur: 10,
            shadowColor: "rgba(29,185,84,.24)",
          },
          itemStyle: {
            color: "#181818",
            borderColor: "#1DB954",
            borderWidth: 2.5,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(29,185,84,.28)" },
              { offset: 0.55, color: "rgba(29,185,84,.08)" },
              { offset: 1, color: "rgba(29,185,84,0)" },
            ]),
          },
          emphasis: {
            focus: "series",
            scale: true,
            itemStyle: { color: "#1DB954", borderColor: "#d8ffe5", borderWidth: 2 },
          },
          markPoint: hasPositiveValue
            ? {
                silent: true,
                symbol: "circle",
                symbolSize: 12,
                label: { show: false },
                itemStyle: {
                  color: "#1DB954",
                  borderColor: "rgba(216,255,229,.9)",
                  borderWidth: 2,
                  shadowBlur: 18,
                  shadowColor: "rgba(29,185,84,.65)",
                },
                data: [{ type: "max" }],
              }
            : undefined,
          z: 3,
        },
      ],
    };
  }, [axisLabelFormatter, axisValueFormatter, initialWindow, integerValues, points, seriesName, tooltipLabelFormatter, valueFormatter]);

  if (!points.length) {
    return <div className="flex items-center justify-center text-sm text-[#777]" style={{ height }}>{emptyText}</div>;
  }

  return (
    <div dir="ltr" onClick={(event) => event.stopPropagation()}>
      <ReactECharts
        option={option}
        style={{ height, width: "100%" }}
        notMerge
        lazyUpdate
        opts={{ renderer: "canvas", useCoarsePointer: true, useDirtyRect: true } as any}
      />
    </div>
  );
};

export default PremiumTimelineChart;

import { InjectionToken } from '@angular/core';

// Generic chart data and configuration tokens to be used with ngComponentOutlet and injectors.

/**
 * Injection token for the chart's dataset.
 * Expected type: any[]
 */
export const CHART_DATA = new InjectionToken<any[]>('Chart Data');

/**
 * Injection token for the chart's title.
 * Expected type: string
 */
export const CHART_TITLE = new InjectionToken<string>('Chart Title');

/**
 * Injection token for the chart's ARIA label for accessibility.
 * Expected type: string
 */
export const CHART_ARIA_LABEL = new InjectionToken<string>('Chart Aria Label');

/**
 * Injection token for the chart's descriptive text, often used for accessibility.
 * Expected type: string
 */
export const CHART_DESCRIPTION = new InjectionToken<string>('Chart Description');

/**
 * Injection token to control the visibility of the chart's legend.
 * Expected type: boolean
 */
export const CHART_SHOW_LEGEND = new InjectionToken<boolean>('Chart Show Legend');

/**
 * Injection token for the chart's size (e.g., width/height).
 * Expected type: number
 */
export const CHART_SIZE = new InjectionToken<number>('Chart Size');

/**
 * Injection token for the stroke width in charts that use lines or borders (like pie charts).
 * Expected type: number
 */
export const CHART_STROKE_WIDTH = new InjectionToken<number>('Chart Stroke Width');

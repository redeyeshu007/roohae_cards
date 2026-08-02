import { Point } from 'fabric';

/**
 * Calculates a midpoint between two points.
 */
export function getMidPoint(p1: Point, p2: Point): Point {
  return new Point(p1.x + (p2.x - p1.x) / 2, p1.y + (p2.y - p1.y) / 2);
}

/**
 * Basic generic smoothing logic to construct a path array from an array of points.
 * Uses quadratic bezier curves between midpoints for a smooth path.
 */
export function smoothPathFromPoints(points: Point[]): any[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [['M', points[0]!.x, points[0]!.y], ['L', points[0]!.x, points[0]!.y]];
  if (points.length === 2) return [['M', points[0]!.x, points[0]!.y], ['L', points[1]!.x, points[1]!.y]];

  const pathArray: any[] = [];
  pathArray.push(['M', points[0]!.x, points[0]!.y]);
  
  for (let i = 1; i < points.length - 1; i++) {
    const mid = getMidPoint(points[i]!, points[i + 1]!);
    pathArray.push(['Q', points[i]!.x, points[i]!.y, mid.x, mid.y]);
  }

  const last = points[points.length - 1]!;
  pathArray.push(['L', last.x, last.y]);

  return pathArray;
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Generate a random number between min and max
 */
export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

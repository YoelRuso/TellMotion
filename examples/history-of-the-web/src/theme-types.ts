/** Shape of a TellMotion theme at runtime (see themes/*.json). */
export interface ThemeTokens {
  id: string;
  name: string;
  family: string;
  moods: string[];
  fonts: {family: string; fontsource: string; google: string; fallback: string; weights: number[]; scale?: number};
  colors: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    line: string;
    stroke?: string;
    onAccent: string;
    async: string;
    ok: string;
    error: string;
    /** 5 category colors: use them to tell element types apart (and in the legend). */
    categories: string[];
    tints?: string[];
  };
  background: {
    kind: 'solid' | 'grid' | 'dots' | 'gradient';
    color?: string;
    opacity?: number;
    step?: number;
    gradient?: {angle?: number; stops: [string, number][]};
  };
  shape: {
    radius: number;
    stroke: number;
    dash: [number, number] | null;
    fill: 'surface' | 'accent' | 'tint' | 'none' | 'glass';
    strokeFrom: 'accent' | 'line' | 'stroke';
    shadow: 'none' | 'soft' | 'hard' | 'glow' | 'clay';
    doubleBorder: boolean;
  };
  motion: {pace: number; easing: 'inOutCubic' | 'inOutSine' | 'inOutQuad' | 'linear'; entrance: 'pop' | 'fade' | 'slide'};
  decor?: string[];
}

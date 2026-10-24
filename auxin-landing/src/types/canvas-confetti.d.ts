declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: ('square' | 'circle' | 'star')[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  function confetti(options?: ConfettiOptions): Promise<null> | null;

  namespace confetti {
    function reset(): void;
    function create(
      canvas: HTMLCanvasElement,
      options?: { resize?: boolean; useWorker?: boolean }
    ): (options?: ConfettiOptions) => Promise<null> | null;
  }

  export default confetti;
}

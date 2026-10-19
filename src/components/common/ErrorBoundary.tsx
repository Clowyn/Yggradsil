import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert, RotateCcw, Compass } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ArcaneErrorBoundary] Uncaught realm exception:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleReturnHome = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#07080d] text-stone-200 flex items-center justify-center p-6 relative overflow-hidden">
          {/* Ambient crimson/gold background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-rose-900/10 blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full bg-amber-600/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-lg w-full rounded-2xl border border-amber-500/35 bg-gradient-to-b from-[#13111c]/95 to-[#090a10]/95 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(244,63,94,0.15)] space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/50 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-cinzel font-bold uppercase tracking-[0.25em] text-rose-400">
                SANCTUARY BREACHED • KADİM MÜHÜRLER KIRILDI
              </div>
              <h1 className="text-2xl font-cinzel font-black text-amber-200 tracking-wide">
                The Arcane Weave Was Disrupted
              </h1>
              <p className="text-xs font-inter text-stone-400 leading-relaxed">
                Beklenmeyen bir büyü bozulması sahneyi kesintiye uğrattı. Mühürleri yeniden uyumlayarak maceranıza kaldığınız yerden devam edebilirsiniz.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left rounded-xl bg-black/60 border border-rose-900/40 p-3.5 max-h-32 overflow-auto">
                <div className="text-[10px] font-cinzel uppercase tracking-wider text-rose-400/90 mb-1">
                  Runic Diagnostic Trace
                </div>
                <pre className="text-[11px] font-mono text-stone-300 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-cinzel font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Yeniden Uyumla / Reload</span>
              </button>

              <button
                type="button"
                onClick={this.handleReturnHome}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-500/30 text-amber-200 font-cinzel font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                <Compass size={14} />
                <span>Sefer Masasına Dön</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ArcaneErrorBoundary = ErrorBoundary;

import { ITraceProvider, TraceRequest, TraceResult } from './types';
import { PythonTraceProvider } from './PythonTraceProvider';
import { CTraceProvider } from './CTraceProvider';
import { JavaTraceProvider } from './JavaTraceProvider';

/**
 * TraceManager routes trace requests to the appropriate language provider.
 *
 * Architecture:
 *   TraceManager
 *     ├── CTraceProvider     (c)
 *     ├── CTraceProvider     (cpp)
 *     ├── PythonTraceProvider (python)
 *     └── JavaTraceProvider  (java)
 */
export class TraceManager implements ITraceProvider {
  private cProvider = new CTraceProvider('c');
  private cppProvider = new CTraceProvider('cpp');
  private pythonProvider = new PythonTraceProvider();
  private javaProvider = new JavaTraceProvider();

  public async trace(request: TraceRequest): Promise<TraceResult> {
    switch (request.language) {
      case 'c':
        return this.cProvider.trace(request);
      case 'cpp':
        return this.cppProvider.trace(request);
      case 'python':
        return this.pythonProvider.trace(request);
      case 'java':
        return this.javaProvider.trace(request);
      default:
        return {
          status: 'unsupported',
          events: [],
          totalSteps: 0,
          error: `Trace is not supported for language: ${request.language}`,
          language: request.language,
        };
    }
  }
}

export const traceManager = new TraceManager();

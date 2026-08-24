import {
  ExecutionRequest,
  ExecutionResult,
  IExecutionProvider
} from './types';
import { LocalExecutionProvider } from './LocalExecutionProvider';

export class ExecutionManager implements IExecutionProvider {
  private localProvider = new LocalExecutionProvider();

  public async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    return await this.localProvider.execute(request);
  }
}

export const executionManager = new ExecutionManager();

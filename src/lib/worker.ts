import { createSession } from './session';
import type { WorkerRequest } from './session';

const session = createSession((response) => postMessage(response));

addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  void session.handle(event.data);
});

import { AsyncLocalStorage } from 'async_hooks';

interface UserContext {
  userId: string;
}

export const authLocalStorage = new AsyncLocalStorage<UserContext>();
import { describe, it, expect, beforeEach } from 'vitest';
import { useLoginMemoryStore } from './loginMemoryStore';

describe('loginMemoryStore', () => {
  beforeEach(() => {
    useLoginMemoryStore.setState({ lastEmail: null, lastMethod: null });
  });

  it('starts with nothing remembered', () => {
    expect(useLoginMemoryStore.getState()).toMatchObject({ lastEmail: null, lastMethod: null });
  });

  it('remembers an email and method together', () => {
    useLoginMemoryStore.getState().remember('jane@example.com', 'password');
    expect(useLoginMemoryStore.getState()).toMatchObject({
      lastEmail: 'jane@example.com',
      lastMethod: 'password',
    });
  });

  it('a method-only update (Google) keeps the previously remembered email', () => {
    useLoginMemoryStore.getState().remember('jane@example.com', 'password');
    useLoginMemoryStore.getState().remember(undefined, 'google');
    expect(useLoginMemoryStore.getState()).toMatchObject({
      lastEmail: 'jane@example.com',
      lastMethod: 'google',
    });
  });
});

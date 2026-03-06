import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useUiStore } from './uiStore';

beforeEach(() => {
  useUiStore.setState({ toasts: [] });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('uiStore.addToast', () => {
  it('adds a toast with correct type and message', () => {
    useUiStore.getState().addToast('success', 'Done!');
    const toasts = useUiStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('Done!');
    expect(toasts[0].id).toBeTruthy();
  });

  it('adds an error toast', () => {
    useUiStore.getState().addToast('error', 'Something went wrong');
    expect(useUiStore.getState().toasts[0].type).toBe('error');
  });

  it('adds multiple toasts independently', () => {
    useUiStore.getState().addToast('success', 'First');
    useUiStore.getState().addToast('error', 'Second');
    expect(useUiStore.getState().toasts).toHaveLength(2);
  });
});

describe('uiStore.removeToast', () => {
  it('removes toast by id', () => {
    useUiStore.getState().addToast('success', 'Test');
    const id = useUiStore.getState().toasts[0].id;
    useUiStore.getState().removeToast(id);
    expect(useUiStore.getState().toasts).toHaveLength(0);
  });
});

describe('uiStore auto-dismiss', () => {
  it('removes toast after 3 seconds', () => {
    useUiStore.getState().addToast('success', 'Auto-dismiss me');
    expect(useUiStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(3000);
    expect(useUiStore.getState().toasts).toHaveLength(0);
  });

  it('does not remove toast before 3 seconds', () => {
    useUiStore.getState().addToast('success', 'Still here');
    vi.advanceTimersByTime(2999);
    expect(useUiStore.getState().toasts).toHaveLength(1);
  });
});

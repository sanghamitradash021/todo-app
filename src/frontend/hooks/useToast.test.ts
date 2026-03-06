import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from './useToast';
import { useUiStore } from '../store/uiStore';

beforeEach(() => {
  useUiStore.setState({ toasts: [] });
});

describe('useToast', () => {
  it('returns toasts from uiStore', () => {
    useUiStore.setState({ toasts: [{ id: '1', type: 'success', message: 'Hi' }] });
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toHaveLength(1);
  });

  it('addToast delegates to uiStore', () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.addToast('error', 'Oops'));
    expect(useUiStore.getState().toasts[0].message).toBe('Oops');
  });
});

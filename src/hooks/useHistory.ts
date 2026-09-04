import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHistory,
  getHistoryById,
  getHistoryForUrl,
  deleteHistoryEntry,
  clearAllHistory,
} from '@utils/storage';
import type { HistoryEntry } from '@types/index';

export function useGetHistory() {
  return useQuery<HistoryEntry[]>({
    queryKey: ['history'],
    queryFn: () => getHistory(),
    staleTime: 1000 * 30,
  });
}

export function useGetHistoryById(id: string | null) {
  return useQuery<HistoryEntry | null>({
    queryKey: ['history', id],
    queryFn: () => (id ? getHistoryById(id) : null),
    enabled: !!id,
  });
}

export function useGetHistoryByUrl(url: string | null) {
  return useQuery<HistoryEntry[]>({
    queryKey: ['history', 'url', url],
    queryFn: () => (url ? getHistoryForUrl(url) : []),
    enabled: !!url && url.length > 0,
  });
}

export function useDeleteHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteHistoryEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useClearHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      clearAllHistory();
    },
    onSuccess: () => {
      queryClient.setQueryData<HistoryEntry[]>(['history'], []);
    },
  });
}

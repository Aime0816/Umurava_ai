// ── candidatesSlice.ts ────────────────────────────────────────
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Candidate } from '@/types';
import { apiClient } from '@/lib/api';

interface CandidatesState {
  list: Candidate[];
  selected: Candidate | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
}

const initialState: CandidatesState = {
  list: [], selected: null, loading: false, error: null, total: 0, page: 1,
};

export const fetchCandidates = createAsyncThunk(
  'candidates/fetch',
  async (params: { page?: number; skill?: string; location?: string } = {}) => {
    const qs = new URLSearchParams({ page: String(params.page || 1), limit: '20', ...params as Record<string, string> });
    const response = await apiClient.get(`/candidates?${qs}`);
    return response.data;
  }
);

export const createCandidates = createAsyncThunk(
  'candidates/create',
  async (profiles: object[], { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/candidates', profiles);
      return response.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      return rejectWithValue(error.response?.data?.error || 'Failed to create candidates');
    }
  }
);

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    selectCandidate(state, action: PayloadAction<Candidate | null>) {
      state.selected = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCandidates.pending, (state) => { state.loading = true; })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.total = action.payload.pagination?.total || 0;
      })
      .addCase(fetchCandidates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch';
      })
      .addCase(createCandidates.fulfilled, (state, action) => {
        state.list.unshift(...(Array.isArray(action.payload) ? action.payload : [action.payload]));
      });
  },
});

export const { selectCandidate } = candidatesSlice.actions;
export default candidatesSlice.reducer;

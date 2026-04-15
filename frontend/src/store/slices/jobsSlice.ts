import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Job } from '@/types';
import { apiClient } from '@/lib/api';

interface JobsState {
  list: Job[];
  selected: Job | null;
  loading: boolean;
  error: string | null;
}

const initialState: JobsState = { list: [], selected: null, loading: false, error: null };

export const fetchJobs = createAsyncThunk('jobs/fetch', async () => {
  const response = await apiClient.get('/jobs?status=active');
  return response.data.data as Job[];
});

export const createJob = createAsyncThunk('jobs/create', async (job: Partial<Job>, { rejectWithValue }) => {
  try {
    const response = await apiClient.post('/jobs', job);
    return response.data.data as Job;
  } catch (err: unknown) {
    const error = err as { response?: { data?: { error?: string } } };
    return rejectWithValue(error.response?.data?.error || 'Failed to create job');
  }
});

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    selectJob(state, action: PayloadAction<Job | null>) {
      state.selected = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => { state.loading = true; })
      .addCase(fetchJobs.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchJobs.rejected, (state) => { state.loading = false; })
      .addCase(createJob.fulfilled, (state, action) => { state.list.unshift(action.payload); });
  },
});

export const { selectJob } = jobsSlice.actions;
export default jobsSlice.reducer;

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Screening, RankedCandidate, ScreeningFormState, Seniority, EmploymentType } from '@/types';
import { apiClient } from '@/lib/api';

interface ScreeningState {
  current: {
    form: ScreeningFormState;
    stagedCandidates: object[];
    results: RankedCandidate[];
    screeningId: string | null;
    status: 'idle' | 'loading' | 'success' | 'error';
    error: string | null;
    processingTimeMs: number | null;
  };
  history: Screening[];
  historyLoading: boolean;
  selectedResult: RankedCandidate | null;
}

const defaultForm: ScreeningFormState = {
  jobTitle: '',
  department: '',
  description: '',
  requiredSkills: [],
  niceToHaveSkills: [],
  minExperience: 0,
  seniority: 'Mid-level' as Seniority,
  employmentType: 'Full-time' as EmploymentType,
  scoringWeights: { skills: 50, experience: 30, education: 20 },
};

const initialState: ScreeningState = {
  current: {
    form: defaultForm,
    stagedCandidates: [],
    results: [],
    screeningId: null,
    status: 'idle',
    error: null,
    processingTimeMs: null,
  },
  history: [],
  historyLoading: false,
  selectedResult: null,
};

// ── Async thunks ──────────────────────────────────────────────

export const runScreening = createAsyncThunk(
  'screening/run',
  async (
    payload: { jobId: string; candidateIds: string[]; topCount?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post('/screenings', payload);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      return rejectWithValue(error.response?.data?.error || 'Screening failed');
    }
  }
);

export const fetchScreeningHistory = createAsyncThunk(
  'screening/fetchHistory',
  async () => {
    const response = await apiClient.get('/screenings?limit=20');
    return response.data.data;
  }
);

export const fetchScreeningById = createAsyncThunk(
  'screening/fetchById',
  async (id: string) => {
    const response = await apiClient.get(`/screenings/${id}`);
    return response.data.data;
  }
);

// ── Slice ─────────────────────────────────────────────────────

const screeningSlice = createSlice({
  name: 'screening',
  initialState,
  reducers: {
    updateForm(state, action: PayloadAction<Partial<ScreeningFormState>>) {
      state.current.form = { ...state.current.form, ...action.payload };
    },
    addRequiredSkill(state, action: PayloadAction<string>) {
      if (!state.current.form.requiredSkills.includes(action.payload)) {
        state.current.form.requiredSkills.push(action.payload);
      }
    },
    removeRequiredSkill(state, action: PayloadAction<string>) {
      state.current.form.requiredSkills = state.current.form.requiredSkills.filter(s => s !== action.payload);
    },
    setStagedCandidates(state, action: PayloadAction<object[]>) {
      state.current.stagedCandidates = action.payload;
    },
    appendStagedCandidates(state, action: PayloadAction<object[]>) {
      state.current.stagedCandidates.push(...action.payload);
    },
    removeStagedCandidate(state, action: PayloadAction<number>) {
      state.current.stagedCandidates.splice(action.payload, 1);
    },
    selectResult(state, action: PayloadAction<RankedCandidate | null>) {
      state.selectedResult = action.payload;
    },
    resetScreening(state) {
      state.current = { ...initialState.current };
    },
    updateWeights(state, action: PayloadAction<{ skills?: number; experience?: number; education?: number }>) {
      state.current.form.scoringWeights = {
        ...state.current.form.scoringWeights,
        ...action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runScreening.pending, (state) => {
        state.current.status = 'loading';
        state.current.error = null;
        state.current.results = [];
      })
      .addCase(runScreening.fulfilled, (state, action) => {
        state.current.status = 'success';
        state.current.results = action.payload.data.results;
        state.current.screeningId = action.payload.data.screeningId;
        state.current.processingTimeMs = action.payload.data.processingTimeMs;
      })
      .addCase(runScreening.rejected, (state, action) => {
        state.current.status = 'error';
        state.current.error = action.payload as string;
      })
      .addCase(fetchScreeningHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchScreeningHistory.fulfilled, (state, action) => {
        state.history = action.payload;
        state.historyLoading = false;
      })
      .addCase(fetchScreeningHistory.rejected, (state) => {
        state.historyLoading = false;
      });
  },
});

export const {
  updateForm,
  addRequiredSkill,
  removeRequiredSkill,
  setStagedCandidates,
  appendStagedCandidates,
  removeStagedCandidate,
  selectResult,
  resetScreening,
  updateWeights,
} = screeningSlice.actions;

export default screeningSlice.reducer;

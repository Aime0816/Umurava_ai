import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  activeView: 'dashboard' | 'screening' | 'rankings' | 'candidates' | 'jobs';

  modalOpen: string | null;
}

const initialState: UiState = {
  sidebarOpen: true,
  activeView: 'dashboard',
  modalOpen: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setView(state, action: PayloadAction<UiState['activeView']>) {
      state.activeView = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    openModal(state, action: PayloadAction<string>) {
      state.modalOpen = action.payload;
    },
    closeModal(state) {
      state.modalOpen = null;
    },
  },
});

export const { setView, toggleSidebar, openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;

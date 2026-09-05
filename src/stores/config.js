import { defineStore } from 'pinia';
import { getConfig, updateConfig } from '@/api/config';

export const useConfigStore = defineStore('config', {
  state: () => ({
    config: null,
    loading: false,
    saving: false,
  }),
  actions: {
    async fetchConfig() {
      this.loading = true;
      try {
        const res = await getConfig();
        this.config = res;
        return res;
      } catch (err) {
        console.error('Failed to fetch config:', err);
      } finally {
        this.loading = false;
      }
    },
    async saveConfig(updatedData) {
      this.saving = true;
      try {
        const res = await updateConfig(updatedData);
        this.config = res;
        return res;
      } catch (err) {
        throw err;
      } finally {
        this.saving = false;
      }
    },
  },
});

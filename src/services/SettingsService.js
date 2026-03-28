// src/services/SettingsService.js

export class SettingsService {
  static KEY = 'kmp_transport_settings';

  static getDefaults() {
    return {
      pesoJaulaDoble: 21500.0,
      precioKmDouble: 3100.0,
      pesoJaulaSimple: 15500.0,
      precioKmSimple: 2500.0,
      margenGanancia: 1.1 // 10% margen
    };
  }

  static loadSettings() {
    const defaultSettings = this.getDefaults();
    try {
      const stored = localStorage.getItem(this.KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Error loading settings from localStorage', e);
    }
    return defaultSettings;
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('Error saving settings', e);
      return false;
    }
  }
}

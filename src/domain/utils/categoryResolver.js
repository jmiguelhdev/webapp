// src/domain/utils/categoryResolver.js

/**
 * Standardizes a product name into a main category.
 * Replicates the logic from resolveCategoryFromName in Kotlin.
 * @param {string} name 
 * @returns {string}
 */
export function resolveCategoryFromName(name) {
  if (!name) return 'OTRO';
  const cleanName = name.trim().toLowerCase();

  if (cleanName.startsWith('nov') || cleanName.includes('novillo') || 
      cleanName.startsWith('nto') || cleanName.startsWith('mej') ||
      cleanName.startsWith('no ')
  ) {
    return 'NOVILLO';
  }

  if (cleanName.startsWith('vq') || cleanName.startsWith('vaq')) {
    return 'VAQUILLONA';
  }

  if (cleanName.startsWith('vaca') || cleanName.startsWith('vac') ||
      cleanName.startsWith('vaca cons') || cleanName.startsWith('vaca flaca') ||
      cleanName.startsWith('va')
  ) {
    return 'VACA';
  }

  if (cleanName.startsWith('to') || cleanName.startsWith('toro')) {
    return 'TORO';
  }

  return 'OTRO';
}

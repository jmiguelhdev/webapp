// src/domain/usecases/GetTravels.js
import { Travel } from '../entities/Travel.js';

/**
 * Caso de uso para obtener, filtrar y ordenar viajes comerciales del usuario.
 */
export class GetTravels {
  /**
   * @param {Object} travelRepository - Repositorio de viajes.
   */
  constructor(travelRepository) {
    this.travelRepository = travelRepository;
  }

  /**
   * Obtiene la lista de viajes filtrada y ordenada.
   * @param {Object} [options={}] - Parámetros de consulta.
   * @param {string} [options.uid] - ID del usuario.
   * @param {string} [options.filter='TODOS'] - Filtro de estado ('TODOS', 'ACTIVO', 'BORRADOR').
   * @param {string} [options.sort='DESC'] - Sentido de ordenamiento ('ASC' o 'DESC').
   * @returns {Promise<Array<Travel>>} Lista de viajes ordenados.
   */
  async execute({ uid, filter = 'TODOS', sort = 'DESC' } = {}) {
    const travels = await this.travelRepository.fetchTravels(uid);
    
    // Convert to Entity
    let filtered = travels.map(t => new Travel(t));

    // Filter
    if (filter !== 'TODOS') {
      filtered = filtered.filter(t => {
        if (filter === 'ACTIVO') return t.status === 'ACTIVE' || t.status === 'COMPLETED';
        if (filter === 'BORRADOR') return t.status === 'DRAFT';
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return sort === 'DESC' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }
}

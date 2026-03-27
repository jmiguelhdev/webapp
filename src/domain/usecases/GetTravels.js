// src/domain/usecases/GetTravels.js
import { Travel } from '../entities/Travel.js';

export class GetTravels {
  constructor(travelRepository) {
    this.travelRepository = travelRepository;
  }

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

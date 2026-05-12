/**
 * src/adapters/Exceptions.js
 * Excepciones de dominio personalizadas para manejar errores de forma estructurada.
 */

export class DomainRuleError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DomainRuleError';
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'NetworkError';
    this.originalError = originalError;
  }
}

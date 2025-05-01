class ValidationError extends Error {
  constructor(errors, message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors.inner.reduce((acc, err) => {
      acc[err.path] = err.message;
      return acc;
    }, {});
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      details: this.errors,
    };
  }
}

export default ValidationError;

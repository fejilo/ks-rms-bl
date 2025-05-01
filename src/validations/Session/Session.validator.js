import ValidationError from '../validationError.js';
import { createSessionSchemas } from './Session.schema.js';

class SessionValidator {
  constructor(language = 'en') {
    this.schemas = createSessionSchemas(language);
  }

  validateLogin(data) {
    try {
      return this.schemas.loginSchema.validateSync(data, { abortEarly: false });
    } catch (error) {
      throw new ValidationError(error, 'Login validation failed');
    }
  }

  validateRegister(data) {
    try {
      return this.schemas.registerSchema.validateSync(data, { abortEarly: false });
    } catch (error) {
      throw new ValidationError(error, 'Register validation failed');
    }
  }

  validateRecovery(data) {
    try {
      return this.schemas.recoverySchema.validateSync(data, { abortEarly: false });
    } catch (error) {
      throw new ValidationError(error, 'Recovery validation failed');
    }
  }

  validateChangePassword(data) {
    try {
      return this.schemas.changePasswordSchema.validateSync(data, { abortEarly: false });
    } catch (error) {
      throw new ValidationError(error, 'Change password validation failed');
    }
  }
}

export default SessionValidator;

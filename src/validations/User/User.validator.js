import ValidationError from '../validationError.js';
import { createUserSchemas } from './User.schema.js';

class UserValidator {
  constructor(language = 'en') {
    this.schemas = createUserSchemas(language);
  }

  validateUserCreate(data) {
    try {
      return this.schemas.userCreateSchema.validateSync(data, { abortEarly: false });
    } catch (error) {
      throw new ValidationError(error, 'User create validation failed');
    }
  }

  validateUserUpdate(data) {
    try {
      return this.schemas.userUpdateSchema.validateSync(data, { abortEarly: false });
    } catch (error) {
      throw new ValidationError(error, 'User update validation failed');
    }
  }

  validateChangePassword(data) {
    try {
      return this.schemas.changePasswordSchema.validateSync(data, { abortEarly: false });
    } catch (error) {
      throw new ValidationError(error, 'Change Password validation failed');
    }
  }
}

export default UserValidator;

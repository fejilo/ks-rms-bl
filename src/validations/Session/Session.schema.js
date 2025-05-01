import * as yup from 'yup';
import validationMessages from '../validationMessages.js';

export const createSessionSchemas = (language = 'en') => {
  const messages = validationMessages[language];

  return {
    loginSchema: yup.object().shape({
      username: yup.string().required(messages.required).email(messages.email),
      password: yup.string().required(messages.required).min(6, messages.passwordLength),
    }),
    recoverySchema: yup.object().shape({
      username: yup.string().required(messages.required).email(messages.email),
    }),
    registerSchema: yup.object().shape({
      username: yup.string().required(messages.required).email(messages.email),
      password: yup.string().required(messages.required).min(6, messages.passwordLength),
      confirmPassword: yup.string().oneOf([yup.ref('password'), null], messages.passwordConfirm),
    }),
    changePasswordSchema: yup.object().shape({
      password: yup.string().required(messages.required).min(6, messages.passwordLength),
      confirmPassword: yup.string().oneOf([yup.ref('password'), null], messages.passwordConfirm),
      userRecoveryUuid: yup.string().required(messages.required),
    }),
  };
};

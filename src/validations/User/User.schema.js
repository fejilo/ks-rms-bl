import * as yup from 'yup';
import validationMessages from '../validationMessages.js';

export const createUserSchemas = (language = 'en') => {
  const messages = validationMessages[language];

  return {
    userCreateSchema: yup.object().shape({
      username: yup.string().required(messages.required).email(messages.email),
      password: yup.string().required(messages.required).min(6, messages.passwordLength),
      firstName: yup.string().required(messages.required),
      lastName: yup.string().required(messages.required),
      imageFileId: yup.number(),
    }),
    userUpdateSchema: yup.object().shape({
      userId: yup.number().integer().required(messages.required),
    }),
    changePasswordSchema: yup.object().shape({
      password: yup.string().required(messages.required).min(6, messages.passwordLength),
      confirmPassword: yup.string().oneOf([yup.ref('password'), null], messages.passwordConfirm),
    }),
    createCampaignModeSchema: yup.object().shape({
      campaignModeName: yup.string().required(messages.required),
      campaignIdCsv: yup.string().required(messages.required),
    }),
  };
};

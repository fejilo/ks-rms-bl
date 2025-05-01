import '../config.js';
import { Cache, Auth, Data, Event } from 'ks-adapters';
import Session from '../../clientLogic/Session.js';

(async () => {
  try {
    const cacheAdapter = new Cache('localStorage');
    const authAdapter = new Auth('JWT');
    const dataAdapter = new Data('mock');
    const eventAdapter = new Event('eventBus');

    const session = new Session(
      { cacheAdapter, authAdapter, dataAdapter, eventAdapter },
      { anonymous: { id: 10000, username: 'anonymous@kizansolutions.com', password: '123456' }, appToken: process.env.APP_JWT }
    );

    await session.login({
      //username: 'user.com',
      username: 'user@kizansolutions.com',
      password: '123456',
      lts: true,
    });

    await session.init();

    console.log('Session:', session);
    console.log('User:', session.auth.user.campaigns);

    session.logout();
    console.log('Session after logout:', session);

    await session.init();

    console.log('Session after init:', session);
  } catch (error) {
    console.log(error);
  }
})();

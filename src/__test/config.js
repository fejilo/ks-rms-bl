import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { JSDOM } from 'jsdom';
//import { create_sdk, apiURL } from 'ks_data_protocol_ui';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const { window } = new JSDOM(`<!DOCTYPE html><p>Testing</p>`, { url: 'https://localhost' });
global.window = window;
global.document = window.document;
global.localStorage = window.localStorage;
global.app = { sdk: {} };

/*import rms_definition from 'rms_definition'; //only work in test mode
global.app.sdk['rms'] = create_sdk(rms_definition, true);*/

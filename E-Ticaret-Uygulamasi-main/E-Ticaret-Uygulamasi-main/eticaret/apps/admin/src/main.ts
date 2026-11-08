import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { App } from './app';
import 'zone.js';


bootstrapApplication(App, appConfig).catch((err) => console.error(err));

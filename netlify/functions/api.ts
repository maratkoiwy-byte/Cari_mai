import express from 'express';
import serverless from 'serverless-http';
import { createApiApp } from '../../api/index';

const apiApp = createApiApp();
const wrapper = express();

wrapper.use((req, _res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    const rest = req.url.slice('/.netlify/functions/api'.length) || '/';
    req.url = `/api${rest.startsWith('/') ? rest : `/${rest}`}`;
  } else if (!req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
  }
  next();
});
wrapper.use(apiApp);

export const handler = serverless(wrapper);


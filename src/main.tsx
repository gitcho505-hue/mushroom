import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Site } from './site';
import './styles.css';
import './readability.css';
import './forest-experience.css';

const app = <React.StrictMode><BrowserRouter><Site /></BrowserRouter></React.StrictMode>;
const root = document.getElementById('root')!;

if (import.meta.env.DEV) ReactDOM.createRoot(root).render(app);
else ReactDOM.hydrateRoot(root, app);
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Site } from './site';
import './styles.css';
import './readability.css';
import './forest-experience.css';
import './site-refinements.css';
import './business-pages.css';
import './harvest-lightbox.css';
import './product-detail.css';
import './home-intro.css';
import './footer-campaign.css';
import './brand.css';
import './gallery.css';
import './seasonal-selection.css';
import './related-section.css';
import './catalog-cards.css';
import './main-navigation.css';

const app = <React.StrictMode><BrowserRouter><Site /></BrowserRouter></React.StrictMode>;
const root = document.getElementById('root')!;

if (import.meta.env.DEV || !root.hasChildNodes()) ReactDOM.createRoot(root).render(app);
else ReactDOM.hydrateRoot(root, app);

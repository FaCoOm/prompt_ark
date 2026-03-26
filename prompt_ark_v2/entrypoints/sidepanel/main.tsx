import { render } from 'solid-js/web';
import App from './App';
import { I18nProvider } from '../../src/i18n';
import './style.css';

render(
  () => (
    <I18nProvider>
      <App />
    </I18nProvider>
  ),
  document.getElementById('root')!
);

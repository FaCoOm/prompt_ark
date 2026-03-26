import { render } from 'solid-js/web';
import { I18nProvider } from '../../src/i18n/context';
import './style.css';
import App from './App';

render(
  () => (
    <I18nProvider>
      <App />
    </I18nProvider>
  ),
  document.getElementById('root')!
);

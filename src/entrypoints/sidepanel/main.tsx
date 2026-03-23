import { render } from 'solid-js/web';
import { SidePanelApp } from './SidePanelApp';
import './styles.css';

const root = document.getElementById('root');
if (root) {
  render(() => <SidePanelApp />, root);
}
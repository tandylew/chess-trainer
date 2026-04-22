import SquareColorDrill from './drills/square-color.js';

const DRILL_IDS = ['square-color', 'knight-sight', 'piece-tracking', 'diagonal-sweep'];

const DRILL_CLASSES = {
  'square-color': SquareColorDrill,
};

class DrillManager {
  constructor() {
    this.currentDrill = null;
    this.isActive = false;
    this._instance = null;

    this.views = { menu: document.getElementById('view-menu') };
    for (const id of DRILL_IDS) {
      this.views[id] = document.getElementById(`view-${id}`);
    }

    document.querySelectorAll('.back-btn').forEach(btn => {
      btn.addEventListener('click', () => this._goMenu());
    });

    window.addEventListener('hashchange', () => this._route());
    this._route();
  }

  _route() {
    const hash = location.hash.replace(/^#/, '');
    this._showView(DRILL_IDS.includes(hash) ? hash : 'menu');
  }

  _showView(name) {
    if (this._instance) {
      this._instance.stop?.();
      this._instance = null;
    }

    for (const view of Object.values(this.views)) {
      view?.classList.remove('active');
    }
    const view = this.views[name] ?? this.views.menu;
    view.classList.add('active');

    if (name !== 'menu') {
      this.currentDrill = name;
      this.isActive = true;
      const DrillClass = DRILL_CLASSES[name];
      if (DrillClass) {
        const body = view.querySelector('.drill-body');
        this._instance = new DrillClass(body);
        this._instance.start?.();
      }
    } else {
      this.currentDrill = null;
      this.isActive = false;
    }
  }

  _goMenu() {
    history.pushState(null, '', location.pathname + location.search);
    this._showView('menu');
  }
}

const drillManager = new DrillManager();
export default drillManager;

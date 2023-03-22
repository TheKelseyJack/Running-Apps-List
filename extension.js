/**
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *  Copyright 2023 Paul Coates
 *
 **/

const Gio       = imports.gi.Gio;
const GObject   = imports.gi.GObject;
const St        = imports.gi.St;
const Meta      = imports.gi.Meta;
const Shell     = imports.gi.Shell;
const Main      = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const APPLICATION_ICON_SIZE = 32;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const AppList = GObject.registerClass(
class AppList extends PanelMenu.Button {

  _init() {
    super._init(0.0, "AppList");

    // Add icon to panel
    let icon = new St.Icon({
      gicon: Gio.icon_new_for_string(Me.dir.get_path() + '/blue.png'),
      style_class: 'system-status-icon'
    });
    this.add_child(icon);

    this.addWindows();
 
    this.menu.connect('open-state-changed', (menu, open) => {
      if (open) this.refresh();
    });
  }

  destroy() {
    this.clearWindows();
    super.destroy();
  }

  refresh() {
    this.clearWindows();
    this.addWindows(); 
  }

  clearWindows() {
    this.menu.removeAll();
  }

  getSettings() {
    let GioSSS = Gio.SettingsSchemaSource;
    let schemaSource = GioSSS.new_from_directory(
      Me.dir.get_child("schemas").get_path(),
      GioSSS.get_default(),
      false
    );
    let schemaObj = schemaSource.lookup('org.gnome.desktop.wm.preferences', true);
    if (!schemaObj) {
      throw new Error('cannot find schemas');
    }
    return new Gio.Settings({ settings_schema : schemaObj });
  }

  addWindows() {
    var j, len1, ref1, results, apps, icon, wsitem, label1;

    let settings = this.getSettings();
    let arr = settings.get_strv('workspace-names');

    // Get number of workspaces
    let workspaceManager = global.workspace_manager;
    this._currentWorkspace = workspaceManager.get_active_workspace_index();
    for (let i = 0; i < workspaceManager.n_workspaces; i++) {
      label1 = "Workspace " + (i+1);
      if (arr[i]!="") {
        label1 = arr[i] + " (Workspace " + (i+1) + ")";
      }
      wsitem = new PopupMenu.PopupMenuSection();
      wsitem.actor.add_child( new PopupMenu.PopupMenuItem(label1, { style_class: 'my-menu-section' }));

      this.menu.addMenuItem(wsitem);
      // Get all running apps on this workspace
      ref1 = global.display.get_tab_list(Meta.TabList.NORMAL_ALL, null);
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        let metaWindow = ref1[j];
        if (metaWindow.get_workspace().index() == i) {
          // Create a menu item for the app
          let iapp = Shell.WindowTracker.get_default().get_window_app(metaWindow);
          let ttl = metaWindow.get_title();
          if (metaWindow.minimized) {
            ttl = "[ " + metaWindow.get_title() + " ]";
          }
          this.addItem({ name: ttl, icon: iapp.get_icon(), workspace: i }, this, metaWindow);
        }
      }
    }

    // this.addSeparator();
    // this.addItem({ name: 'Settings', callback: this.refresh });
  }

  addItem(data, parent, wss) {
    let item;
    if (data.name) {
      if (data.icon) {
        item = new PopupMenu.PopupImageMenuItem(data.name, data.icon, { style_class: 'my-menu-item' });
      }else {
        item = new PopupMenu.PopupMenuItem(data.name, { style_class: 'my-menu-item' });
      }

      if (wss) {
        item.connect('activate', () => {
          // Change to workspace where app lives
          wss.get_workspace().activate(global.get_current_time());
          // Restore window if minimised
          if (wss.minimized) wss.unminimize();
          // Raise window so it is above all other windows
          wss.raise();
          //log('CLICKED ' + data.name);
        });
      }else
      if (data.callback) {
        item.connect('activate', data.callback);
      }

      if (parent) {
        parent.menu.addMenuItem(item);
      }else {
        this.menu.addMenuItem(item);
      }
    }
    return item;
  }

  addSeparator() {
    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
  }

})

// Don't touch below as all functionality is now in the class

let appList;

function init() {
}

function enable() {
  appList = new AppList();
  Main.panel.addToStatusArea('appList', appList, 1);
}

function disable() {
  appList.destroy();
  appList = null;
}


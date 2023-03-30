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
 *  v1	- Initial release
 *  v3	- Added workspace names
 *  v4	- Made the workspace section larger
 *        Swapped over workspace and workspace name
 *        Added CURRENT label to the current workspace
 *        Added a scrollbar to the popup in case the list goes off the bottom of the screen
 *        Made the popup wider to identify windows with long similar names
 *        Added workspace switcher buttons to each window in the list
 *  v5	- Fix to close popup once window selected
 *  v7	- Removed Lang module
 *        Cleaned up CSS so names match stylesheet
 *  v8  - Fixed bug with workspace names when list is empty
 *        Added preferences to change size, color and hide buttons
 *
 **/

const Clutter   = imports.gi.Clutter;
const Gio       = imports.gi.Gio;
const GObject   = imports.gi.GObject;
const St        = imports.gi.St;
const Meta      = imports.gi.Meta;
const Shell     = imports.gi.Shell;
const Main      = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Gettext   = imports.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Domain = Gettext.domain(Me.metadata.uuid);

const _ = Domain.gettext;
const ngettext = Domain.ngettext;

const RunningAppList = GObject.registerClass(
class RunningAppList extends PanelMenu.Button {

  _init() {
    super._init(St.Align.START, "RunningAppList");

    this.extSettings = new ExtensionUtils.getSettings('org.gnome.shell.extensions.running-apps');

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

  addWindows() {
    var numWindows, appWindows;

    // Setup a scroll view in case there are so many windows open the list goes off the screen
    this.workspaceSection = new PopupMenu.PopupMenuSection();
    this.scrollViewWorkspaceMenuSection = new PopupMenu.PopupMenuSection();
    let workspaceScrollView = new St.ScrollView({
      style_class: 'ral-workspace-menu-section',
      overlay_scrollbars: true,
      hscrollbar_policy: St.PolicyType.NEVER,
      vscrollbar_policy: St.PolicyType.AUTOMATIC
    });
    workspaceScrollView.add_actor(this.workspaceSection.actor);

    this.scrollViewWorkspaceMenuSection.actor.add_actor(workspaceScrollView);
    this.menu.addMenuItem(this.scrollViewWorkspaceMenuSection);

    // Read list of workspace names
    let desktopSettings = new Gio.Settings({schema: 'org.gnome.desktop.wm.preferences'});
    this.workspaceNames = desktopSettings.get_strv('workspace-names');

    workspaceScrollView.set_style("max-height: " + this.extSettings.get_int('list-height') + "px");

    // Get number of workspaces
    let workspaceManager = global.workspace_manager;
    this._currentWorkspace = workspaceManager.get_active_workspace_index();
    for (let i = 0; i < workspaceManager.n_workspaces; i++) {
      this.addSection(i);

      // Get all running apps on this workspace
      appWindows = global.display.get_tab_list(Meta.TabList.NORMAL_ALL, null);
      for (let j = 0, numWindows = appWindows.length; j < numWindows; j++) {
        let metaWindow = appWindows[j];
        if (metaWindow.get_workspace().index() == i) {
          // Create a menu item for the window
          let appIcon = Shell.WindowTracker.get_default().get_window_app(metaWindow);
          let appTitle = metaWindow.get_title();
          if (metaWindow.minimized) {
            appTitle = "[ " + metaWindow.get_title() + " ]";
          }

          this.addItem({ name: appTitle, icon: appIcon.get_icon(), workspace: i, numWorkspaces: workspaceManager.n_workspaces }, metaWindow);
        }
      }
    }
  }

  addSection(i) {
    let label1 = _("Workspace") + " " + (i+1);
    if ((this.workspaceNames.length > i) && (this.workspaceNames[i]!="")) {
      label1 = label1 + " (" + this.workspaceNames[i] + ")";
    }

    let menuItem = new PopupMenu.PopupMenuItem("", { style_class: 'ral-menu-section' });

    menuItem.set_style("background-color: " + this.extSettings.get_string('workspace-header-color') + "; width: " + this.extSettings.get_int('list-width') + "px;");

    let lLabel = new St.Label({
      style_class: 'ral-section-title',
      text: label1,
      x_align: Clutter.ActorAlign.START,
      x_expand: false,
      y_expand: true
    });
    menuItem.actor.add_child(lLabel);

    if (this._currentWorkspace == i) {
      let rLabel = new St.Label({
        style_class: 'ral-section-title',
        text: _("CURRENT"),
        x_align: Clutter.ActorAlign.END,
        x_expand: true,
        y_expand: true
      });
      menuItem.actor.add_child(rLabel);
    }

    this.workspaceSection.addMenuItem(menuItem);
  }

  addItem(data, wswindow) {
    var fname, upBtn, downBtn;
    let menuItem = new PopupMenu.PopupImageMenuItem(data.name, data.icon, { style_class: 'ral-menu-item' });;

    menuItem.set_style("width: " + this.extSettings.get_int('list-width') + "px");
    if (this.extSettings.get_boolean('show-workspace-change-buttons') == true) {

      let wsNum = wswindow.get_workspace().index();

      if (wsNum + 1 == data.numWorkspaces) {
        downBtn = this.addIcon('goa-account-symbolic', true);
      }else {
        downBtn = this.addIcon('pan-down-symbolic', true);
        downBtn.connect('clicked', () => {
          wswindow.change_workspace_by_index(data.workspace + 1, false);
          this.refresh();
        });
      }
      menuItem.actor.add_child(downBtn);

      if (wsNum == 0) {
        upBtn = this.addIcon('goa-account-symbolic', false);
      }else {
        upBtn = this.addIcon('pan-up-symbolic', false);
        upBtn.connect('clicked', () => {
          wswindow.change_workspace_by_index(data.workspace - 1, false);
          this.refresh();
        });
      }
      menuItem.actor.add_child(upBtn);
    }

    if (wswindow) {
      menuItem.connect('activate', () => {
        // Change to workspace where app lives
        wswindow.get_workspace().activate(global.get_current_time());
        // Restore window if minimised
        if (wswindow.minimized) wswindow.unminimize();
        // Raise window so it is above all other windows
        wswindow.raise();
        // Close popup once switched to window
        this.menu.close();
      });
    }

    this.workspaceSection.addMenuItem(menuItem);
  }

  addIcon(icon_name, expand) {
    let icon = new St.Icon({
      icon_name: icon_name,
      style_class: 'system-status-icon'
    });

    let icoBtn = new St.Button({
      style_class: 'ral-action-btn',
      can_focus: true,
      child: icon,
      x_align: Clutter.ActorAlign.END,
      x_expand: expand,
      y_expand: true
    });

    return icoBtn;
  }

  addSeparator() {
    this.workspaceSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
  }

})

// Don't touch below as all functionality is now in the class

let runningAppList;

function init() {
  ExtensionUtils.initTranslations(Me.metadata.uuid);
}

function enable() {
  runningAppList = new RunningAppList();
  Main.panel.addToStatusArea('runningAppList', runningAppList, 1);
}

function disable() {
  runningAppList.destroy();
  runningAppList = null;
}


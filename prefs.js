import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class AppListPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {

    window._settings = this.getSettings();

    const page = new Adw.PreferencesPage({
      title: _('General'),
      icon_name: 'dialog-information-symbolic',
    });
    window.add(page);

    // Size

    let group1 = new Adw.PreferencesGroup({
      title: _('Size'),
      description: _('Set the size of the window list'),
    });
    page.add(group1);

    let row1a = new Adw.ActionRow({
      title: _('List width'),
      subtitle: _('Maximum width of the window list')
    });
    group1.add(row1a);
    let adjust1 = new Gtk.Adjustment({ lower: 240, upper: 800, step_increment: 1 });
    let btn1 = new Gtk.SpinButton({ adjustment: adjust1 });
    window._settings.bind('list-width', adjust1, 'value', Gio.SettingsBindFlags.DEFAULT);
    row1a.add_suffix(btn1);

    let row1b = new Adw.ActionRow({
      title: _('List height'),
      subtitle: _('Maximum height of the window list')
    });
    group1.add(row1b);
    let adjust2 = new Gtk.Adjustment({ lower: 240, upper: 800, step_increment: 1 });
    let btn2 = new Gtk.SpinButton({ adjustment: adjust2 });
    window._settings.bind('list-height', adjust2, 'value', Gio.SettingsBindFlags.DEFAULT);
    row1b.add_suffix(btn2);

    // Theme

    let group2 = new Adw.PreferencesGroup({
      title: _('Theme Color'),
      description: _('Set the theme of the window list'),
    });
    page.add(group2);

    let row2a = new Adw.ActionRow({
      title: _('Workspace header color')
    });
    group2.add(row2a);

    let col = window._settings.get_string('workspace-header-color');
    let rr = new Gdk.RGBA();
    rr.parse(col); 
    let color1 = new Gtk.ColorButton({ valign: Gtk.Align.CENTER, rgba: rr });
    color1.connect('color-set', (button) => {
      window._settings.set_string('workspace-header-color', button.get_rgba().to_string());
    });
    row2a.add_suffix(color1);
    row2a.activatable_widget = color1;

    // Behavior

    let group3 = new Adw.PreferencesGroup({
      title: _('Behavior'),
      description: _('Set the behavior of the window list'),
    });
    page.add(group3);

    let row3a = new Adw.SwitchRow({
      title: _('Show workspace change buttons')
    });
    group3.add(row3a);
    window._settings.bind('show-workspace-change-buttons', row3a, 'active', Gio.SettingsBindFlags.DEFAULT);
  }
}



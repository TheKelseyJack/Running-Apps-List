'use strict';

const { Adw, Gio, Gtk, Gdk } = imports.gi;
const Gettext = imports.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Domain = Gettext.domain(Me.metadata.uuid);

const _ = Domain.gettext;
const ngettext = Domain.ngettext;

function init() {
}

function fillPreferencesWindow(window) {
    let settings = new ExtensionUtils.getSettings('org.gnome.shell.extensions.running-apps');

    const page = new Adw.PreferencesPage();

    // Size Section

    let group1 = new Adw.PreferencesGroup();
    group1.set_title(_("Size"));
    page.add(group1);

    // Width

    let row1 = new Adw.ActionRow({ title: _('List width'), subtitle: _('Maximum width of the window list') });
    group1.add(row1);

    let adjust1 = new Gtk.Adjustment({ lower: 240, upper: 800, step_increment: 1 });
    let btn1 = new Gtk.SpinButton({ adjustment: adjust1 });
    settings.bind('list-width', adjust1, 'value', Gio.SettingsBindFlags.DEFAULT);
    row1.add_suffix(btn1);

    // Height

    let row2 = new Adw.ActionRow({ title: _('List height'), subtitle: _('Maximum height of the window list') });
    group1.add(row2);

    let adjust2 = new Gtk.Adjustment({ lower: 240, upper: 800, step_increment: 1 });
    let btn2 = new Gtk.SpinButton({ adjustment: adjust2 });
    settings.bind('list-height', adjust2, 'value', Gio.SettingsBindFlags.DEFAULT);
    row2.add_suffix(btn2);



    // Color Section

    let group2 = new Adw.PreferencesGroup();
    group2.set_title(_("Theme Color"));
    page.add(group2);

    // Select color

    let row3 = new Adw.ActionRow({ title: _('Workspace header color') });
    group2.add(row3);

    let col = settings.get_string('workspace-header-color');
    let rr = new Gdk.RGBA();
    rr.parse(col); 
    let color1 = new Gtk.ColorButton({ valign: Gtk.Align.CENTER, rgba: rr });
    color1.connect('color-set', (button) => {
      settings.set_string('workspace-header-color', button.get_rgba().to_string());
    });
    row3.add_suffix(color1);
    row3.activatable_widget = color1;



    // Function Section

    let group3 = new Adw.PreferencesGroup();
    group3.set_title(_("Behavior"));
    page.add(group3);

    // Workspace arrows

    let row5 = new Adw.ActionRow({ title: _('Show workspace change buttons') });
    group3.add(row5);

    let toggle1 = new Gtk.Switch({ active: settings.get_boolean('show-workspace-change-buttons'), valign: Gtk.Align.CENTER, });
    settings.bind('show-workspace-change-buttons', toggle1, 'active', Gio.SettingsBindFlags.DEFAULT);
    row5.add_suffix(toggle1);
    row5.activatable_widget = toggle1;

    window.add(page);
}




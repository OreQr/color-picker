import {
  app,
  BrowserWindow,
  globalShortcut,
  screen,
  Tray,
  Menu,
} from "electron";
import path from "path";
import settings from "electron-settings";
import isDev from "electron-is-dev";

require("@electron/remote/main").initialize();

app.whenReady().then(() => {
  if (!settings.hasSync("bind"))
    settings.setSync({ bind: "CommandOrControl+Shift+C" });

  globalShortcut.register(
    <Electron.Accelerator>settings.getSync("bind"),
    () => {
      pick();
    }
  );

  const tray = new Tray(path.join(__dirname, "../../icon.ico"));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: app.getLocale() == "pl" ? "Zamknij" : "Close",
      type: "normal",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Color picker");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    pick();
  });

  if (isDev) {
    require("electron-reloader")(module, {
      debug: true,
      watchRenderer: true,
    });
  }
});

function pick() {
  screen.getAllDisplays().forEach((monitor) => {
    const { x, y } = monitor.bounds;
    const newWindow = new BrowserWindow({
      show: false,
      skipTaskbar: true,
      autoHideMenuBar: true,
      kiosk: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      x: x + 50,
      y: y + 50,
    });

    require("@electron/remote/main").enable(newWindow.webContents);

    newWindow.loadFile(path.join(__dirname, "../../index.html"));

    if (isDev) {
      newWindow.webContents.openDevTools();
    }
  });
}

app.on("window-all-closed", () => {
  app.dock.hide();
});

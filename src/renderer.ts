import screenshot from "screenshot-desktop";
import {
  getCurrentWindow,
  screen,
  clipboard,
  BrowserWindow,
} from "@electron/remote";

const currentWindow = getCurrentWindow();
const windowBounds = currentWindow.getBounds();
const currentScreen = screen.getDisplayNearestPoint({
  x: windowBounds.x,
  y: windowBounds.y,
});

const screens = screen.getAllDisplays();
const screenIndex = screens.findIndex(
  (element) => element.id == currentScreen.id
);

window.addEventListener("DOMContentLoaded", () => {
  const canvas = <HTMLCanvasElement>document.getElementById("pick");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  screenshot.listDisplays().then((displays) => {
    screenshot({ screen: displays[screenIndex].id, format: "png" }).then(
      (screenshot) => {
        const image = new Image();
        image.src = `data:image/png;base64,${screenshot.toString("base64")}`;
        image.onload = () => {
          ctx.drawImage(image, 0, 0);
          currentWindow.show();
        };
      }
    );
  });

  const color = <HTMLCanvasElement>document.getElementById("color");
  const colorCtx = color.getContext("2d");
  colorCtx.imageSmoothingEnabled = false;

  canvas.addEventListener("mousemove", (event) => {
    const hex = getColor(event.clientX, event.clientY);

    color.style.borderColor = hex;

    color.style.transform = `translateY(${event.clientY + 10}px)`;
    color.style.transform += `translateX(${event.clientX + 10}px)`;

    colorCtx.clearRect(0, 0, color.width, color.height);
    colorCtx.drawImage(
      canvas,
      event.clientX - 8,
      event.clientY - 8,
      17,
      17,
      0,
      0,
      200,
      200
    );

    colorCtx.beginPath();
    for (let x = 0; x <= 200; x += 200 / 17) {
      colorCtx.moveTo(x, 0);
      colorCtx.lineTo(x, 200);
    }
    for (let y = 0; y <= 200; y += 200 / 17) {
      colorCtx.moveTo(0, y);
      colorCtx.lineTo(200, y);
    }
    colorCtx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    colorCtx.stroke();

    colorCtx.strokeStyle = "rgba(250, 50, 50, 1)";
    colorCtx.strokeRect((200 / 17) * 8, (200 / 17) * 8, 200 / 17, 200 / 17);
  });

  canvas.addEventListener("mouseleave", () => {
    color.style.display = "none";
  });

  canvas.addEventListener("mouseenter", () => {
    color.style.display = "block";
  });

  canvas.addEventListener("click", (event) => {
    const hex = getColor(event.clientX, event.clientY);

    console.log(event.clientX, event.clientY, hex);
    clipboard.writeText(hex);
    BrowserWindow.getAllWindows().forEach((window) => {
      if (window.id == currentWindow.id) return;
      window.destroy();
    });
    currentWindow.destroy();
  });

  function getColor(x: number, y: number) {
    const data = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(data[0], data[1], data[2]);

    return hex;
  }
});

function rgbToHex(r: number, g: number, b: number) {
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

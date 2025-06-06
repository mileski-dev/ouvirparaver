// script.js

// Importa Client do Gradio a partir do bundle correto em jsDelivr
import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@latest/dist/index.min.js";

async function setupClient() {
  // Conecta ao Space público
  return await Client.connect("mileskidev/ouvir-para-ver");
}

async function resizeImageToBlob(file) {
  // 1) Carrega o arquivo 
  const img = await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = reject;
    image.src = url;
  });

  // 2) Calcula proporção para manter ≤ 1024×1024
  const maxSize = 1024;
  let { width, height } = img;
  if (width > maxSize || height > maxSize) {
    const ratio = Math.min(maxSize / width, maxSize / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // 3) Desenha no canvas redimensionado
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  // 4) Converte 
  return await new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      "image/jpeg",
      0.8
    );
  });
}

// Event listener 
document.getElementById("btnSend").addEventListener("click", async () => {
  const input = document.getElementById("imgInput");
  if (!input.files || input.files.length === 0) {
    alert("Por favor, escolha uma imagem primeiro.");
    return;
  }

  const captionEl = document.getElementById("caption");
  captionEl.innerText = "Processando...";

  try {
    // 1) Conecta ao Space Gradio
    const client = await setupClient();

    // 2) Redimensiona o arquivo e obtém Blob
    const blob = await resizeImageToBlob(input.files[0]);

    // 3) Envia o Blob para o endpoint "/predict"
    const result = await client.predict("/predict", { image: blob });

    // 4) Extrai a legenda retornada (em pt-BR)
    const legenda = result.data[0];
    captionEl.innerText = legenda;

    // 5) Síntese de voz da legenda
    speechSynthesis.speak(new SpeechSynthesisUtterance(legenda));
  } catch (err) {
    captionEl.innerText = `Erro: ${err.message}`;
    console.error(err);
  }
});

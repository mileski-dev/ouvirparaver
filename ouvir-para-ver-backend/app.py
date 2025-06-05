from io import BytesIO
from PIL import Image
import gradio as gr
from transformers import BlipProcessor, BlipForConditionalGeneration, pipeline

# 1) Carrega processor e modelo BLIP
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model     = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

# 2) Carrega pipeline de tradução Inglês → Português
translator = pipeline("translation", model="Helsinki-NLP/opus-mt-tc-big-en-pt")

def infer_caption(image):
    # 1) Redimensiona mantendo proporção para max 1024×1024
    max_size = 1024
    w, h = image.size
    if max(w, h) > max_size:
        ratio = max_size / max(w, h)
        new_size = (int(w * ratio), int(h * ratio))
        image = image.resize(new_size, Image.LANCZOS)

    # 2) Gera legenda em inglês com BLIP
    inputs  = processor(image, return_tensors="pt").to(model.device)
    outputs = model.generate(**inputs)
    english_caption = processor.decode(outputs[0], skip_special_tokens=True)

    # 3) Traduz para português (pt-BR)
    translated = translator(english_caption, max_length=128)
    portuguese_caption = translated[0]["translation_text"]

    return portuguese_caption

# 3) Cria interface Gradio
interface = gr.Interface(
    fn=infer_caption,
    inputs=gr.Image(type="pil"),
    outputs="text",
    title="Ouvir Para Ver",
    description="Envie uma imagem e receba a descrição."
)

if __name__ == "__main__":
    interface.launch(server_name="0.0.0.0", share=False)

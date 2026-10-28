// Os arquivos de mídia ficam nesta pasta junto com o site.
const visitMedia = [
  { type: 'photo', src: 'midias/parcerias/amigos-cidade-nova/foto-01.jpg.jpeg', caption: 'Atividade coletiva no tatame durante a visita à ONG.' },
  { type: 'photo', src: 'midias/parcerias/amigos-cidade-nova/foto-02.jpg.jpeg', caption: 'Participantes em uma atividade de artes marciais.' },
  { type: 'video', src: 'midias/parcerias/amigos-cidade-nova/WhatsApp Video 2026-10-27 at 21.06.07.mp4', caption: 'Registro em vídeo da visita à ONG — parte 1.' },
  { type: 'video', src: 'midias/parcerias/amigos-cidade-nova/WhatsApp Video 2026-10-27 at 21.06.33.mp4', caption: 'Registro em vídeo da visita à ONG — parte 2.' },
];
const gallery = document.querySelector('#partner-gallery');
const viewer = document.querySelector('#photo-viewer');
visitMedia.forEach(item => {
  const figure = document.createElement('figure');
  const caption = document.createElement('figcaption');
  caption.textContent = item.caption;
  const media = document.createElement(item.type === 'video' ? 'video' : 'img');
  const show = () => { figure.hidden = false; document.querySelector('#gallery-status').hidden = true; };
  figure.hidden = true;
  if (item.type === 'video') {
    media.controls = true;
    media.playsInline = true;
    media.setAttribute('aria-label', item.caption);
    media.preload = 'metadata';
    media.addEventListener('loadedmetadata', show);
    figure.append(media);
  } else {
    media.alt = item.caption;
    media.addEventListener('load', show);
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Ampliar foto: ${item.caption}`);
    button.append(media);
    button.addEventListener('click', () => {
      const expanded = document.querySelector('#expanded-photo');
      expanded.src = item.src;
      expanded.alt = item.caption;
      document.querySelector('#photo-caption').textContent = item.caption;
      viewer.showModal();
    });
    figure.append(button);
  }
  media.addEventListener('error', () => { figure.hidden = true; });
  media.src = item.src;
  figure.append(caption);
  gallery.append(figure);
});
document.querySelector('#close-photo').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });

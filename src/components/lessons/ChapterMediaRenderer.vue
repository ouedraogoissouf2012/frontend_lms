<template>
  <div>
    <!-- VIDEO -->
    <div v-if="chapter.content_type === 'video' && chapter.video_url" class="content-block content-video">
      <div class="video-container">
        <iframe
          v-if="videoEmbedUrl"
          :src="videoEmbedUrl"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          class="video-iframe"
        ></iframe>
        <div v-else class="video-fallback">
          <i class="fa fa-play-circle"></i>
          <p>Vidéo non intégrable</p>
          <a
            v-if="canOpenVideo"
            :href="safeVideoUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-external-video"
            data-test="open-video"
          >
            <i class="fa fa-external-link"></i> Ouvrir la vidéo
          </a>
          <p v-else class="media-unavailable" data-test="video-unavailable">
            Lien vidéo indisponible.
          </p>
        </div>
      </div>
    </div>

    <!-- PDF -->
    <div v-if="chapter.content_type === 'pdf' && canOpenPdf" class="content-block content-pdf">
      <div v-if="canOpenPdf" class="pdf-viewer">
        <iframe
          :src="safePdfUrl"
          class="pdf-iframe"
          frameborder="0"
        ></iframe>
        <a :href="safePdfUrl" target="_blank" rel="noopener noreferrer" class="btn-open-pdf">
          <i class="fa fa-external-link"></i> Ouvrir le PDF en plein écran
        </a>
      </div>
      <div v-else class="pdf-empty">
        <i class="fa fa-file-pdf-o"></i>
        <p>Le document PDF n'est pas encore disponible.</p>
      </div>
    </div>

    <!-- LINK -->
    <div v-if="chapter.content_type === 'link' && chapter.external_link" class="content-block content-link">
      <div class="link-card">
        <i class="fa fa-external-link-square"></i>
        <div class="link-info">
          <h3>Ressource externe</h3>
          <p class="link-url">{{ chapter.external_link }}</p>
        </div>
        <a
          v-if="canOpenExternalLink"
          :href="safeExternalLink"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-open-link"
        >
          Ouvrir <i class="fa fa-arrow-right"></i>
        </a>
        <span v-else class="link-disabled" data-test="link-unavailable">
          Lien indisponible
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { safeUrl } from '@/utils/security/safeUrl'
/**
 * Rendu des chapitres média/ressource externe (#H4 ≤300) : vidéo (iframe embed),
 * PDF (viewer) et lien externe. Logique d'URL déléguée à utils/lessonContent.
 */
import { getVideoEmbedUrl, getPdfUrl, getVideoOpenUrl } from '@/utils/lessonContent'

const props = defineProps({
  chapter: { type: Object, required: true }
})

const videoEmbedUrl = computed(() => getVideoEmbedUrl(props.chapter.video_url))
const safeVideoUrl = computed(() => safeUrl(getVideoOpenUrl(props.chapter.video_url)))
const safePdfUrl = computed(() => safeUrl(getPdfUrl(props.chapter)))
const safeExternalLink = computed(() => safeUrl(props.chapter.external_link))

const canOpenVideo = computed(() => safeVideoUrl.value !== '#')
const canOpenPdf = computed(() => safePdfUrl.value !== '#')
const canOpenExternalLink = computed(() => safeExternalLink.value !== '#')
</script>

<style scoped>
/* Content blocks */
.content-block {
  margin-bottom: 2rem;
}

/* VIDEO CONTENT */
.video-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  background: var(--black);
  border-radius: 0.75rem;
  overflow: hidden;
}

.video-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.video-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--text-disabled);
}

.video-fallback i {
  font-size: 4rem;
  opacity: 0.5;
}

.btn-external-video {
  padding: 0.75rem 1.5rem;
  background: var(--blue-500);
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 600;
}

/* PDF CONTENT */
.pdf-viewer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pdf-iframe {
  width: 100%;
  height: 75vh;
  border-radius: 0.75rem;
  border: 1px solid var(--border-primary);
}

.btn-open-pdf {
  align-self: flex-end;
  padding: 0.5rem 1rem;
  color: var(--blue-400);
  text-decoration: none;
  font-size: 0.85rem;
}

.btn-open-pdf:hover {
  text-decoration: underline;
}

.pdf-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.pdf-empty i {
  font-size: 3rem;
  opacity: 0.5;
}

/* LINK CONTENT */
.link-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;
}

.link-card > i {
  font-size: 2rem;
  color: var(--violet-400);
}

.link-info {
  flex: 1;
  min-width: 0;
}

.link-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.link-url {
  font-size: 0.85rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.btn-open-link {
  padding: 0.625rem 1.25rem;
  background: var(--violet-600);
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 600;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.btn-open-link:hover {
  background: var(--violet-700);
}

.media-unavailable,
.link-disabled {
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
}
</style>

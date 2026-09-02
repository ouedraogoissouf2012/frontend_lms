// Masque le splash-loader une fois la page chargée (l'app Vue est montée).
// Externalisé de index.html (#279) pour permettre une CSP `script-src 'self'`
// stricte : plus aucun script inline dans le document.
window.addEventListener('load', function () {
  setTimeout(function () {
    const loader = document.getElementById('app-loader')
    if (!loader) return
    loader.classList.add('fade-out')
    setTimeout(function () {
      loader.style.display = 'none'
    }, 500)
  }, 300) // petit délai pour laisser voir l'animation
})

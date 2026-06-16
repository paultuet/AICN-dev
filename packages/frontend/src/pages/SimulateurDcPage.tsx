/**
 * Simulateur DC — maquette HTML autonome intégrée telle quelle.
 *
 * Le contenu est servi comme asset statique (public/simulateur-dc.html) et
 * affiché dans une iframe afin de rester totalement isolé du reste de
 * l'application : aucun partage de styles, de state ni de logique.
 */
const SimulateurDcPage = () => {
  return (
    <iframe
      src="/simulateur-dc.html"
      title="Simulateur DC"
      className="block w-full border-0"
      style={{ height: 'calc(100vh - 104px)' }}
    />
  )
}

export default SimulateurDcPage

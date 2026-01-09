import { Helmet } from 'react-helmet-async'

const SEO = ({
  title = 'Sessionkit - Engaging tools for any session',
  description = 'Free interactive tools for meetings, classes, and workshops. Spin wheels, form teams, run quizzes, and gather opinions. Simple tools built for interaction.',
  keywords = 'name roulette, random name picker, team generator, squad scramble, live poll, workshop tools, interactive tools, facilitation tools, meeting tools, classroom tools',
  ogImage = 'https://sessionkit.io/sessionkit-logo.svg',
  url = 'https://sessionkit.io'
}) => {
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Sessionkit" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />
    </Helmet>
  )
}

export default SEO
